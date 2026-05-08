'use client';

type Segment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'boldItalic'; value: string }
  | { type: 'code'; value: string };

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      segments.push({ type: 'boldItalic', value: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ type: 'bold', value: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ type: 'italic', value: match[4] });
    } else if (match[5] !== undefined) {
      segments.push({ type: 'code', value: match[5] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

type LineType = 'h1' | 'h2' | 'h3' | 'text';

function parseLine(line: string): { type: LineType; content: Segment[] } {
  if (line.startsWith('### ')) return { type: 'h3', content: parseInline(line.slice(4)) };
  if (line.startsWith('## ')) return { type: 'h2', content: parseInline(line.slice(3)) };
  if (line.startsWith('# ')) return { type: 'h1', content: parseInline(line.slice(2)) };
  return { type: 'text', content: parseInline(line) };
}

function lineClass(type: LineType): string {
  switch (type) {
    case 'h1':
      return 'text-[17px] font-bold leading-snug mb-2 mt-4';
    case 'h2':
      return 'text-[16px] font-semibold leading-snug mb-2 mt-4';
    case 'h3':
      return 'text-[15px] font-semibold leading-snug mb-1 mt-3';
    default:
      return 'text-[15px] leading-[1.75]';
  }
}

function SegmentEl({ seg }: { seg: Segment }) {
  switch (seg.type) {
    case 'bold':
      return <strong className="font-semibold">{seg.value}</strong>;
    case 'italic':
      return <em className="italic">{seg.value}</em>;
    case 'boldItalic':
      return <strong className="font-semibold italic">{seg.value}</strong>;
    case 'code':
      return (
        <code className="font-mono text-[13px] bg-[#EFEFED] dark:bg-[#2A2A2A] px-1.5 py-0.5 rounded text-[#C96442]">
          {seg.value}
        </code>
      );
    default:
      return <>{seg.value}</>;
  }
}

export function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let inList = false;

  const flush = () => {
    if (!inList) return;
    inList = false;
    elements.push(
      <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">
        {listBuffer.map((item, i) => {
          const parsed = parseInline(item.replace(/^[-*] /, ''));
          return (
            <li key={i}>
              {parsed.map((seg, j) => (
                <SegmentEl key={j} seg={seg} />
              ))}
            </li>
          );
        })}
      </ul>,
    );
    listBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      flush();
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    if (/^[-*] /.test(trimmed)) {
      inList = true;
      listBuffer.push(trimmed);
      continue;
    }

    flush();
    const parsed = parseLine(trimmed);
    elements.push(
      <p key={`p-${i}`} className={lineClass(parsed.type)}>
        {parsed.content.map((seg, j) => (
          <SegmentEl key={j} seg={seg} />
        ))}
      </p>,
    );
  }
  flush();

  return <>{elements}</>;
}
