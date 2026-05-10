import type { DocumentProcessorPort } from '../ports/document-processor-port';
import type { Document } from '@/types';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import crypto from 'crypto';

// Dynamic import to avoid bundling test files
async function loadPdfParse() {
  const module = await import('pdf-parse');
  return module.default || module;
}

export class DocumentProcessorAdapter implements DocumentProcessorPort {
  async processFile(buffer: ArrayBuffer, fileName: string, fileType: string): Promise<Document[]> {
    let text: string;

    switch (fileType) {
      case 'application/pdf':
        text = await this.extractTextFromPDF(buffer);
        break;
      case 'text/plain':
      case 'text/markdown':
        text = this.extractTextFromPlain(buffer);
        break;
      case 'text/csv':
        text = this.extractTextFromCSV(buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        text = await this.extractTextFromDocx(buffer);
        break;
      case 'application/msword':
        throw new Error('Legacy .doc format not supported. Please use .docx, .pdf, .txt, or .csv');
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return this.chunkDocument(text, { source: fileName, fileType });
  }

  async extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    const pdfParse = await loadPdfParse();
    const data = await pdfParse(Buffer.from(buffer));
    return data.text;
  }

  extractTextFromPlain(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
  }

  // Alias for interface compatibility
  extractTextFromTxt(buffer: ArrayBuffer): string {
    return this.extractTextFromPlain(buffer);
  }

  extractTextFromCSV(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder('utf-8');
    const csvText = decoder.decode(buffer);
    const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    // Convert CSV rows to readable text
    const rows = result.data as Record<string, string>[];
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const textLines: string[] = [];

    // Header row
    textLines.push(headers.join(' | '));
    textLines.push(headers.map(() => '---').join(' | '));

    // Data rows
    for (const row of rows) {
      const values = headers.map((h) => row[h] || '');
      textLines.push(values.join(' | '));
    }

    return textLines.join('\n');
  }

  async extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
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
