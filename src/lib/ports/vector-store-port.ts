export interface RetrievedChunk {
  pageContent: string;
  source: string;
  pageNumber?: number;
}

export interface VectorStorePort {
  addDocuments(docs: Document[]): Promise<void>;
  retrieve(query: string, k?: number): Promise<RetrievedChunk[]>;
  deleteSession?(sessionId: string): Promise<void>;
}

export interface Document {
  id: string;
  name?: string;
  content?: string;
  pageContent: string;
  metadata: {
    source: string;
    fileType?: string;
    pageNumber?: number;
  };
}
