#!/usr/bin/env node
/**
 * Qdrant Collection Setup Script
 * Creates notebook-lm-docs with correct vector dimension (768).
 * Safe to re-run — drops existing collection first.
 *
 * Usage:
 *   node scripts/qdrant-setup.cjs
 *
 * Environment:
 *   QDRANT_URL      Full Qdrant Cloud REST URL
 *   QDRANT_API_KEY  Your Qdrant API key
 */

const { QdrantClient } = require('@qdrant/qdrant-js');

const COLLECTION_NAME = 'notebook-lm-docs';
const VECTOR_DIM = 768;

async function setup() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('Set QDRANT_URL and QDRANT_API_KEY before running.');
    console.error('  export QDRANT_URL=https://your-cluster.qdrant.tech');
    console.error('  export QDRANT_API_KEY=your-key');
    process.exit(1);
  }

  const client = new QdrantClient({ url, apiKey });

  console.log(`Connecting: ${url}`);
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Dimension: ${VECTOR_DIM}\n`);

  const status = await client.collectionExists(COLLECTION_NAME);
  const exists = typeof status === 'boolean' ? status : status.exists;

  if (exists) {
    console.log('Collection exists — dropping to recreate...');
    await client.deleteCollection(COLLECTION_NAME);
  }

  await client.createCollection(COLLECTION_NAME, {
    vectors: { size: VECTOR_DIM, distance: 'Cosine' },
  });

  const verify = await client.collectionExists(COLLECTION_NAME);
  const created = typeof verify === 'boolean' ? verify : verify.exists;

  if (created) {
    console.log(`✓ Collection "${COLLECTION_NAME}" created with dim=${VECTOR_DIM}`);
  } else {
    console.error('✗ Failed to create collection');
    process.exit(1);
  }
}

setup().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
