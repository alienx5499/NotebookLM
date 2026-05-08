import type { DocumentProcessorPort } from '../ports/document-processor-port';
import type { Document } from '@/types';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import crypto from 'crypto';

// Dynamic import to avoid bundling test files
async function loadPdfParse() {
  const module = await import('pdf-parse');
  return module.default || module;
}

export class DocumentProcessorAdapter implements DocumentProcessorPort {
  async processFile(buffer: ArrayBuffer, fileName: string, fileType: string): Promise<Document[]> {
    let text: string;

    if (fileType === 'application/pdf') {
      text = await this.extractTextFromPDF(buffer);
    } else if (fileType === 'text/plain') {
      text = this.extractTextFromTxt(buffer);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    return this.chunkDocument(text, { source: fileName, fileType });
  }

  async extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    const pdfParse = await loadPdfParse();
    const data = await pdfParse(Buffer.from(buffer));
    return data.text;
  }

  extractTextFromTxt(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
  }

  private async chunkDocument(
    text: string,
    metadata: { source: string; fileType: string },
  ): Promise<Document[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4000, // Keep chunks small enough for Gemini context
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const texts = await splitter.splitText(text);
    const documents: Document[] = [];

    for (let i = 0; i < texts.length; i++) {
      const chunk = texts[i];
      const pageMatch = chunk.match(/Page (\d+)/);

      documents.push({
        id: crypto.randomUUID(),
        name: metadata.source,
        content: chunk,
        pageContent: chunk,
        metadata: {
          ...metadata,
          pageNumber: pageMatch ? parseInt(pageMatch[1]) : undefined,
        },
      });
    }

    return documents;
  }
}