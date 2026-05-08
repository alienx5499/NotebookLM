export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: string[];
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
