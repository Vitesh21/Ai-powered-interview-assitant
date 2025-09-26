import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
// In Vite, import worker as URL so it's bundled locally (no CDN)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Vite query param
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

GlobalWorkerOptions.workerSrc = pdfWorker as unknown as string;

export interface ExtractedProfile {
  name?: string;
  email?: string;
  phone?: string;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
    text += strings + '\n';
  }
  return text;
}

export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value || '';
}

export async function getResumeText(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }
  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  ) {
    return extractTextFromDocx(file);
  }
  throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
}

export function extractProfileFromText(text: string): ExtractedProfile {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/);

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => !!l);

  // Ignore common headings that could confuse name extraction
  const headingSet = new Set([
    'RESUME',
    'CURRICULUM VITAE',
    'CV',
    'PROFILE',
    'SUMMARY',
    'CONTACT',
    'EXPERIENCE',
    'WORK EXPERIENCE',
    'EDUCATION',
    'SKILLS',
    'PROJECTS',
    'CERTIFICATIONS',
  ]);

  let name: string | undefined;

  // 1) Explicit label like "Name: John Doe"
  for (const line of lines.slice(0, 15)) {
    // Skip headings
    if (headingSet.has(line.toUpperCase())) continue;
    const m = line.match(/^(?:name)\s*[:\-]\s*(.+)$/i);
    if (m) {
      const val = m[1].trim();
      if (val.split(/\s+/).length <= 6) {
        name = toTitleCase(val.replace(/[^A-Za-z'\-\s]/g, '').trim());
        break;
      }
    }
  }

  // 2) First visible header-like line (2-4 words, capitalized or ALL CAPS)
  if (!name) {
    for (const line of lines.slice(0, 10)) {
      if (headingSet.has(line.toUpperCase())) continue;
      if (emailMatch && line.includes(emailMatch[0])) continue;
      if (phoneMatch && line.includes(phoneMatch[0] || '')) continue;
      const parts = line.split(/\s+/);
      const alphaParts = parts.filter((p) => /[A-Za-z]/.test(p));
      if (alphaParts.length >= 2 && alphaParts.length <= 4) {
        // Accept Camel/Title case or ALL CAPS
        const ok = alphaParts.every((p) => /^[A-Z][a-zA-Z'\-]+$/.test(p)) || alphaParts.every((p) => /^[A-Z][A-Z'\-]+$/.test(p));
        if (ok) {
          const val = alphaParts.join(' ');
          name = toTitleCase(val);
          break;
        }
      }
    }
  }

  // 3) Derive from email local-part if available (e.g., john.doe@ -> John Doe)
  if (!name && emailMatch) {
    const local = emailMatch[0].split('@')[0];
    const cleaned = local.replace(/[_.-]+/g, ' ').replace(/\d+/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter((p) => p.length >= 2);
    if (parts.length >= 2 && parts.length <= 4) {
      name = toTitleCase(parts.join(' '));
    }
  }

  // 4) Fallback: first non-empty line if it looks short
  if (!name && lines.length) {
    const first = lines[0].replace(/[^A-Za-z'\-\s]/g, '').trim();
    if (first.split(/\s+/).length <= 5) {
      name = toTitleCase(first);
    }
  }

  return {
    name,
    email: emailMatch?.[0],
    phone: phoneMatch?.[0]?.replace(/\s+/g, ' ').trim(),
  };
}

function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.toUpperCase() === w ? capitalize(w.toLowerCase()) : capitalize(w)))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalize(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// Fallback: derive a probable name from the file name, e.g., "LOMADA_VITESH_REDDY_Resume.pdf" -> "Lomada Vitesh Reddy"
export function deriveNameFromFilename(fileName: string): string | undefined {
  const base = fileName.replace(/\.[^.]+$/, ''); // drop extension
  // remove common resume words
  const cleaned = base
    .replace(/resume|cv|curriculum|vitae|profile|final|updated|new/gi, ' ')
    .replace(/[_\-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned.split(/\s+/).filter((p) => /^[A-Za-z][A-Za-z'\-]*$/.test(p));
  if (parts.length >= 2 && parts.length <= 4) {
    return toTitleCase(parts.join(' '));
  }
  return undefined;
}
