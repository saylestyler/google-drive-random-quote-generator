import { ReflectionEntry, DailyPickState, ExtractedPassage } from '../types';

const REFLECTIONS_KEY = 'epigraph_saved_reflections';
const DAILY_PICK_KEY = 'epigraph_daily_pick';
const DOC_SETTINGS_KEY = 'epigraph_doc_settings';

export function loadSavedReflections(): ReflectionEntry[] {
  try {
    const raw = localStorage.getItem(REFLECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReflectionEntry(entry: ReflectionEntry): void {
  try {
    const existing = loadSavedReflections();
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)];
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save reflection:', err);
  }
}

export function deleteReflectionEntry(id: string): void {
  try {
    const existing = loadSavedReflections();
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete reflection:', err);
  }
}

export function loadDailyPick(): DailyPickState | null {
  try {
    const raw = localStorage.getItem(DAILY_PICK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDailyPick(passage: ExtractedPassage): void {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const state: DailyPickState = {
      date: today,
      passage,
    };
    localStorage.setItem(DAILY_PICK_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save daily pick:', err);
  }
}

export function loadDocSelectionSettings(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DOC_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDocSelectionSettings(settings: Record<string, boolean>): void {
  try {
    localStorage.setItem(DOC_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save doc settings:', err);
  }
}
