import type { VectorStorePort, RetrievedChunk } from '../ports/vector-store-port';
import type { Document } from '@/types';
import { QdrantClient } from '@qdrant/qdrant-js';
import * as path from 'path';
import crypto from 'crypto';
import { GoogleAuth } from 'google-auth-library';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION_NAME = 'notebook-lm-docs';
const PROJECT_ID = 'triple-zenith-457318-b3';
const LOCATION = 'us-central1';
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;

let qdrantClient: QdrantClient | null = null;
let auth: GoogleAuth | null = null;

function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY || undefined,
    });
  }
  return qdrantClient;
}

async function getAuth(): Promise<GoogleAuth> {
  if (!auth) {
    let keyFile: string;
    if (process.env.GCP_JSON_BASE64) {
      const decoded = Buffer.from(process.env.GCP_JSON_BASE64, 'base64').toString('utf-8');
      const fs = await import('fs');
      const tmpPath = path.join('/tmp', 'gcp-vercel.json');
      fs.writeFileSync(tmpPath, decoded);
      keyFile = tmpPath;
    } else {
      keyFile = path.join(process.cwd(), 'gcp.json');
    }
    auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  }
  return auth;
}

async function embedText(text: string): Promise<number[]> {
  const authInst = await getAuth();
  const client = await authInst.getClient();
  const tokenResponse = await client.getAccessToken();

  let accessToken: string;
  if (typeof tokenResponse === 'string') {
    accessToken = tokenResponse;
  } else if (tokenResponse && 'token' in tokenResponse) {
    accessToken = tokenResponse.token || '';
  } else {
    throw new Error('Failed to get access token');
  }

  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [
        {
          task_type: 'RETRIEVAL_DOCUMENT',
          content: text.slice(0, 3000),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.predictions?.[0]?.embeddings?.values || [];
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const batchSize = 3;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((text) => embedText(text)));
    results.push(...batchResults);
  }

  return results;
}

export class QdrantVectorStoreAdapter implements VectorStorePort {
  async addDocuments(docs: Document[]): Promise<void> {
    await this.ensureCollection();
    const client = getQdrantClient();
    const texts = docs.map((doc) => doc.pageContent || doc.content || '');

    console.log(`Generating embeddings for ${texts.length} chunks...`);
    const vectors = await embedBatch(texts);
    console.log('Embeddings generated');

    const points = docs.map((doc, i) => ({
      id: crypto.randomUUID(),
      vector: vectors[i],
      payload: {
        content: doc.pageContent || doc.content,
        source: doc.metadata?.source || '',
        pageNumber: doc.metadata?.pageNumber,
        fileType: doc.metadata?.fileType,
      },
    }));

    console.log(`Uploading ${points.length} vectors...`);
    console.log('Point structure:', JSON.stringify(points[0], null, 2));

    await client.upsert(COLLECTION_NAME, { points, wait: true });
    console.log('Indexing complete');
  }

  async retrieve(query: string, k = 5): Promise<RetrievedChunk[]> {
    const client = getQdrantClient();

    console.log('Generating query embedding...');
    const queryVector = await embedText(query);

    const results = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: k,
      with_payload: true,
    });

    return results.map((result) => ({
      pageContent: (result.payload?.content as string) ?? '',
      pageNumber: result.payload?.pageNumber as number | undefined,
      source: (result.payload?.source as string) ?? '',
    }));
  }

  private async ensureCollection(): Promise<void> {
    const client = getQdrantClient();
    const result = (await client.collectionExists(COLLECTION_NAME)) as
      | { exists: boolean }
      | boolean;
    const exists = typeof result === 'boolean' ? result : (result as { exists: boolean }).exists;
    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: EMBEDDING_DIMENSION,
          distance: 'Cosine',
        },
      });
    }
  }
}
