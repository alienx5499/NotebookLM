import { DocumentProcessorAdapter } from './adapters/document-processor-adapter';
import { QdrantVectorStoreAdapter } from './adapters/qdrant-vector-store-adapter';

let processor: DocumentProcessorAdapter | null = null;
let vectorStore: QdrantVectorStoreAdapter | null = null;

export function getDocumentProcessor(): DocumentProcessorAdapter {
  if (!processor) {
    processor = new DocumentProcessorAdapter();
  }
  return processor;
}

export function getVectorStore(): QdrantVectorStoreAdapter {
  if (!vectorStore) {
    vectorStore = new QdrantVectorStoreAdapter();
  }
  return vectorStore;
}
