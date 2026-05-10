import { NextRequest, NextResponse } from 'next/server';
import { getDocumentProcessor, getVectorStore } from '@/lib/container';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, TXT, CSV, and DOCX supported.' },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const processor = getDocumentProcessor();
    const vectorStore = getVectorStore();

    const docs = await processor.processFile(buffer, file.name, file.type);
    await vectorStore.addDocuments(docs);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunksCreated: docs.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
