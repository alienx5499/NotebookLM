#!/usr/bin/env node
/**
 * Qdrant Collection Setup Script
 * Creates the notebook-lm-docs collection with correct vector dimensions.
 * Run once to initialize. Safe to re-run (drops + recreates).
 *
 * Usage:
 *   npx ts-node scripts/qdrant-setup.ts
 */

import { QdrantClient } from '@qdrant/qdrant-js';

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = 'notebook-lm-docs';
const VECTOR_DIMENSION = 768; // Must match text-embedding-004 output dimension

if (!QDRANT_URL || !QDRANT_API_KEY) {
  console.error('Error: Set QDRANT_URL and QDRANT_API_KEY environment variables.');
  console.error('  export QDRANT_URL=https://your-cluster.qdrant.tech');
  console.error('  export QDRANT_API_KEY=your-api-key');
  process.exit(1);
}

const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

async function setup() {
  console.log(`Connecting to: ${QDRANT_URL}`);
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Vector dimension: ${VECTOR_DIMENSION}\n`);

  // Check if collection exists
  const result = (await client.collectionExists(COLLECTION_NAME)) as { exists: boolean } | boolean;
  const exists = typeof result === 'boolean' ? result : (result as { exists: boolean }).exists;

  if (exists) {
    console.log('Collection exists. Deleting to recreate with correct dimension...');
    await client.deleteCollection(COLLECTION_NAME);
    console.log('Deleted.\n');
  } else {
    console.log('Collection does not exist. Creating...\n');
  }

  // Create with correct dimension
  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      size: VECTOR_DIMENSION,
      distance: 'Cosine',
    },
  });

  // Verify
  const verify = (await client.collectionExists(COLLECTION_NAME)) as { exists: boolean } | boolean;
  const created = typeof verify === 'boolean' ? verify : (verify as { exists: boolean }).exists;

  if (created) {
    console.log(
      `Collection "${COLLECTION_NAME}" created successfully with dim=${VECTOR_DIMENSION}`,
    );
  } else {
    console.error('Failed to create collection!');
    process.exit(1);
  }
}

setup().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
