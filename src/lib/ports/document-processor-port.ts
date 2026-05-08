export interface DocumentProcessorPort {
  processFile(buffer: ArrayBuffer, fileName: string, fileType: string): Promise<Document[]>;
  extractTextFromPDF(buffer: ArrayBuffer): Promise<string>;
  extractTextFromTxt(buffer: ArrayBuffer): string;
}

export interface Document {
  id: string;
  pageContent: string;
  metadata: {
    source: string;
    pageNumber?: number;
  };
}