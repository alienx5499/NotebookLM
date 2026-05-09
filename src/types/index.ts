export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: { pageContent: string; pageNumber?: number; source: string }[];
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

export interface SessionFile {
  name: string;
  chunksCreated: number;
  uploadedAt: number;
}

export interface Session {
  id: string;
  title: string;
  files: SessionFile[];
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
