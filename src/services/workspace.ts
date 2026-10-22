import { DriveDoc, ExtractedPassage, PassageType } from '../types';

// In-memory cache for parsed document passages to avoid re-fetching the same doc
const docPassagesCache = new Map<string, ExtractedPassage[]>();

/**
 * List documents from the user's Google Drive.
 * Supports Google Docs, Word files, Markdown, and plain text.
 * Includes Shared Drives and shared folders.
 */
export async function listDriveDocuments(accessToken: string): Promise<DriveDoc[]> {
  try {
    // 1. Broad query covering Google Docs, plain text, markdown, and Word docs
    const queryParts = [
      "trashed = false",
      "(mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'text/markdown' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')",
    ];
    const query = encodeURIComponent(queryParts.join(' and '));
    const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size)');
    
    // Include shared drives and all drives
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Google Drive error (${response.status}): ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errorMessage = errJson.error.message;
        }
      } catch {
        const errText = await response.text();
        if (errText) errorMessage = errText;
      }
      console.error('Failed to list files from Drive:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    let files: any[] = data.files || [];

    // Fallback: If 0 files found with specific mimeTypes, check if there are any non-folder files
    if (files.length === 0) {
      try {
        const broadQuery = encodeURIComponent("trashed = false and mimeType != 'application/vnd.google-apps.folder'");
        const broadUrl = `https://www.googleapis.com/drive/v3/files?q=${broadQuery}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=50&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        const broadRes = await fetch(broadUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (broadRes.ok) {
          const broadData = await broadRes.json();
          const allFiles: any[] = broadData.files || [];
          // Keep files that look like documents or text
          files = allFiles.filter(
            (f) =>
              f.mimeType?.includes('document') ||
              f.mimeType?.includes('text') ||
              f.name?.endsWith('.doc') ||
              f.name?.endsWith('.docx') ||
              f.name?.endsWith('.txt') ||
              f.name?.endsWith('.md')
          );
        }
      } catch (e) {
        console.warn('Broad query fallback error:', e);
      }
    }

    return files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
      iconLink: file.iconLink,
      size: file.size,
      selectedForReflections: true,
    }));
  } catch (error: any) {
    console.error('listDriveDocuments error:', error);
    throw error;
  }
}

/**
 * Fetches and parses a document by ID.
 * First tries the Google Docs API (AST structure).
 * If that fails or if the file is plain text, falls back to Google Drive export / media.
 */
export async function fetchDocPassages(
  accessToken: string,
  doc: DriveDoc
): Promise<ExtractedPassage[]> {
  if (docPassagesCache.has(doc.id)) {
    return docPassagesCache.get(doc.id)!;
  }

  // 1. Try Google Docs API for native Google Docs
  if (doc.mimeType === 'application/vnd.google-apps.document') {
    try {
      const url = `https://docs.googleapis.com/v1/documents/${doc.id}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const docData = await response.json();
        const passages = parseDocumentStructure(docData, doc);
        if (passages.length > 0) {
          docPassagesCache.set(doc.id, passages);
          return passages;
        }
      } else {
        console.warn(
          `Google Docs API returned ${response.status}. Attempting Drive export fallback...`
        );
      }
    } catch (err) {
      console.warn('Google Docs API failed, falling back to Drive export:', err);
    }

    // Fallback: Use Drive API Export endpoint (plain text)
    try {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=text/plain`;
      const exportRes = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (exportRes.ok) {
        const rawText = await exportRes.text();
        const passages = parsePlainTextToPassages(rawText, doc);
        docPassagesCache.set(doc.id, passages);
        return passages;
      }
    } catch (exportErr) {
      console.warn('Drive export fallback also failed:', exportErr);
    }
  }

  // 2. Plain text / Markdown / other files via Drive API media download
  try {
    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
    const mediaRes = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (mediaRes.ok) {
      const rawText = await mediaRes.text();
      const passages = parsePlainTextToPassages(rawText, doc);
      docPassagesCache.set(doc.id, passages);
      return passages;
    }
  } catch (mediaErr) {
    console.error('Media download error:', mediaErr);
  }

  throw new Error(`Unable to read document contents for "${doc.name}"`);
}

/**
 * Parses plain text content into paragraphs, sentences, and sections.
 */
function parsePlainTextToPassages(rawText: string, doc: DriveDoc): ExtractedPassage[] {
  const blocks = rawText
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const extracted: ExtractedPassage[] = [];
  let currentHeading = '';

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Check if this block looks like a heading
    if (block.length <= 80 && !block.endsWith('.') && (block.startsWith('#') || block.toUpperCase() === block || i === 0)) {
      currentHeading = block.replace(/^#+\s*/, '');
      continue;
    }

    const wordCount = block.split(/\s+/).length;
    const isBoilerplate =
      block.startsWith('http://') ||
      block.startsWith('https://') ||
      /^[0-9\s.,-]+$/.test(block) ||
      block.toLowerCase().includes('table of contents');

    if (!isBoilerplate && block.length >= 45 && block.length <= 1400) {
      // Paragraph
      extracted.push({
        id: `${doc.id}-p-${extracted.length}`,
        text: block,
        docId: doc.id,
        docTitle: doc.name,
        docUrl: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
        headingContext: currentHeading || undefined,
        wordCount,
        characterCount: block.length,
        passageType: 'paragraph',
        extractedAt: new Date().toISOString(),
      });

      // Individual punchy sentences
      const sentences = block
        .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 35 && s.length <= 260 && !s.includes('http'));

      for (const sent of sentences) {
        const sentWords = sent.split(/\s+/).length;
        if (sentWords >= 6) {
          extracted.push({
            id: `${doc.id}-l-${extracted.length}`,
            text: sent,
            docId: doc.id,
            docTitle: doc.name,
            docUrl: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
            headingContext: currentHeading || undefined,
            wordCount: sentWords,
            characterCount: sent.length,
            passageType: 'line',
            extractedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return extracted;
}

interface RawDocParagraph {
  text: string;
  style: string;
  headingId?: string;
}

/**
 * Traverses Docs API JSON AST to extract meaningful text passages.
 */
function parseDocumentStructure(docData: any, doc: DriveDoc): ExtractedPassage[] {
  const content = docData.body?.content || [];
  const rawParagraphs: RawDocParagraph[] = [];

  for (const element of content) {
    if (element.paragraph) {
      const p = element.paragraph;
      const namedStyleType = p.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
      const headingId = p.paragraphStyle?.headingId;

      let paragraphText = '';
      if (Array.isArray(p.elements)) {
        for (const el of p.elements) {
          if (el.textRun?.content) {
            paragraphText += el.textRun.content;
          }
        }
      }

      const trimmed = paragraphText.trim();
      if (trimmed.length > 0) {
        rawParagraphs.push({
          text: trimmed,
          style: namedStyleType,
          headingId,
        });
      }
    }
  }

  const extracted: ExtractedPassage[] = [];
  let currentHeadingContext = '';
  let currentHeadingId: string | undefined = undefined;

  let currentSectionParagraphs: string[] = [];
  let currentSectionWordCount = 0;

  const flushSection = () => {
    if (currentSectionParagraphs.length > 0) {
      const sectionText = currentSectionParagraphs.join('\n\n');
      if (sectionText.length >= 100 && sectionText.length <= 1800) {
        extracted.push({
          id: `${doc.id}-sec-${extracted.length}`,
          text: sectionText,
          docId: doc.id,
          docTitle: doc.name,
          docUrl: currentHeadingId
            ? `${doc.webViewLink}#heading=h.${currentHeadingId}`
            : doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
          headingContext: currentHeadingContext || undefined,
          headingId: currentHeadingId,
          wordCount: currentSectionWordCount,
          characterCount: sectionText.length,
          passageType: 'section',
          extractedAt: new Date().toISOString(),
        });
      }
    }
    currentSectionParagraphs = [];
    currentSectionWordCount = 0;
  };

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    const isHeading =
      p.style.startsWith('HEADING') || p.style === 'TITLE' || p.style === 'SUBTITLE';

    if (isHeading) {
      flushSection();
      currentHeadingContext = p.text;
      currentHeadingId = p.headingId;
      continue;
    }

    const cleanText = p.text
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const wordCount = cleanText.split(/\s+/).length;

    const isBoilerplate =
      cleanText.startsWith('http://') ||
      cleanText.startsWith('https://') ||
      /^[0-9\s.,-]+$/.test(cleanText) ||
      cleanText.toLowerCase().includes('table of contents') ||
      cleanText.toLowerCase().includes('all rights reserved');

    if (!isBoilerplate && cleanText.length >= 45 && cleanText.length <= 1200) {
      // 1. Cohesive Paragraph
      extracted.push({
        id: `${doc.id}-p-${extracted.length}`,
        text: cleanText,
        docId: doc.id,
        docTitle: doc.name,
        docUrl: currentHeadingId
          ? `${doc.webViewLink}#heading=h.${currentHeadingId}`
          : doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
        headingContext: currentHeadingContext || undefined,
        headingId: currentHeadingId,
        wordCount,
        characterCount: cleanText.length,
        passageType: 'paragraph',
        extractedAt: new Date().toISOString(),
      });

      // 2. Extract punchy individual lines / sentences
      const sentences = cleanText
        .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 35 && s.length <= 260 && !s.includes('http'));

      for (const sent of sentences) {
        const sentWords = sent.split(/\s+/).length;
        if (sentWords >= 6) {
          extracted.push({
            id: `${doc.id}-l-${extracted.length}`,
            text: sent,
            docId: doc.id,
            docTitle: doc.name,
            docUrl: currentHeadingId
              ? `${doc.webViewLink}#heading=h.${currentHeadingId}`
              : doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
            headingContext: currentHeadingContext || undefined,
            headingId: currentHeadingId,
            wordCount: sentWords,
            characterCount: sent.length,
            passageType: 'line',
            extractedAt: new Date().toISOString(),
          });
        }
      }

      currentSectionParagraphs.push(cleanText);
      currentSectionWordCount += wordCount;

      if (currentSectionParagraphs.length >= 3) {
        flushSection();
      }
    }
  }

  flushSection();

  return extracted;
}

/**
 * Draws a random passage from a selected set of documents.
 */
export async function drawRandomPassage(
  docs: DriveDoc[],
  accessToken: string,
  preferredType?: PassageType | 'all'
): Promise<ExtractedPassage | null> {
  const eligibleDocs = docs.filter((d) => d.selectedForReflections !== false);
  if (eligibleDocs.length === 0) return null;

  const shuffledDocs = [...eligibleDocs].sort(() => Math.random() - 0.5);

  for (const doc of shuffledDocs) {
    try {
      const passages = await fetchDocPassages(accessToken, doc);
      if (passages.length === 0) continue;

      let filtered = passages;
      if (preferredType && preferredType !== 'all') {
        filtered = passages.filter((p) => p.passageType === preferredType);
      }

      const pool = filtered.length > 0 ? filtered : passages;
      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
      }
    } catch (err) {
      console.warn(`Could not extract passages from ${doc.name}:`, err);
    }
  }

  return null;
}
