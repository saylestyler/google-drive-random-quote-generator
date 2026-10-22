export type PassageType = 'paragraph' | 'line' | 'section';

export interface ExtractedPassage {
  id: string;
  text: string;
  docId: string;
  docTitle: string;
  docUrl: string;
  headingContext?: string;
  headingId?: string;
  wordCount: number;
  characterCount: number;
  passageType: PassageType;
  extractedAt: string;
}

export interface DriveDoc {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
  selectedForReflections?: boolean;
}

export interface ReflectionEntry {
  id: string;
  passage: ExtractedPassage;
  reflectionNotes?: string;
  createdAt: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface DailyPickState {
  date: string; // YYYY-MM-DD
  passage: ExtractedPassage;
}
