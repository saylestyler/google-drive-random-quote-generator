/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { QuoteCard } from './components/QuoteCard';
import { LibraryView } from './components/LibraryView';
import { ArchiveView } from './components/ArchiveView';
import { ExtractedPassage, DriveDoc, ReflectionEntry, PassageType } from './types';
import { SAMPLE_DOCS, SAMPLE_PASSAGES } from './data/sampleDocs';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/auth';
import { listDriveDocuments, drawRandomPassage, fetchDocPassages } from './services/workspace';
import {
  loadSavedReflections,
  saveReflectionEntry,
  deleteReflectionEntry,
  loadDailyPick,
  saveDailyPick,
  loadDocSelectionSettings,
  saveDocSelectionSettings,
} from './services/storage';
import { Calendar, Quote, ShieldCheck, ExternalLink } from 'lucide-react';

const CUSTOM_DOCS_KEY = 'epigraph_custom_documents';

function loadCustomDocs(): DriveDoc[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomDocs(customDocs: DriveDoc[]) {
  try {
    localStorage.setItem(CUSTOM_DOCS_KEY, JSON.stringify(customDocs));
  } catch (e) {
    console.error(e);
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'reflect' | 'library' | 'archive'>('reflect');

  // Documents
  const [docs, setDocs] = useState<DriveDoc[]>(SAMPLE_DOCS);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Active Passage / Quote
  const [currentPassage, setCurrentPassage] = useState<ExtractedPassage | null>(null);
  const [isPassageLoading, setIsPassageLoading] = useState(false);
  const [selectedGranularity, setSelectedGranularity] = useState<PassageType | 'all'>('paragraph');

  // Archive & Reflections
  const [savedReflections, setSavedReflections] = useState<ReflectionEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Helper to pick random from sample passages
  const getRandomSamplePassage = useCallback(
    (type?: PassageType | 'all', docId?: string): ExtractedPassage => {
      let pool = SAMPLE_PASSAGES;
      if (docId) {
        pool = pool.filter((p) => p.docId === docId);
      }
      if (type && type !== 'all') {
        const filtered = pool.filter((p) => p.passageType === type);
        if (filtered.length > 0) pool = filtered;
      }
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx];
    },
    []
  );

  // Sync Google Drive Documents
  const syncDriveDocs = async (forcedToken?: string) => {
    const token = forcedToken || accessToken || (await getAccessToken());

    // If no access token is available, trigger sign in to obtain one
    if (!token) {
      handleLogin();
      return;
    }

    setIsDocsLoading(true);
    setSyncError(null);

    try {
      const driveDocs = await listDriveDocuments(token);
      const settings = loadDocSelectionSettings();
      const custom = loadCustomDocs();

      const mergedDocs = [...custom, ...driveDocs].map((d) => ({
        ...d,
        selectedForReflections: settings[d.id] !== undefined ? settings[d.id] : true,
      }));

      setDocs(mergedDocs);

      if (driveDocs.length === 0 && custom.length === 0) {
        showToast('Google account connected. No Google Docs found in Drive.');
      } else {
        showToast(`Synced ${driveDocs.length} documents from Google Drive.`);
        // Try drawing a passage from real docs
        try {
          const passage = await drawRandomPassage(mergedDocs, token, selectedGranularity);
          if (passage) {
            setCurrentPassage(passage);
            saveDailyPick(passage);
          }
        } catch {
          // Keep current passage
        }
      }
    } catch (err: any) {
      console.error('Error syncing Google Drive:', err);
      const errorMsg = err?.message || 'Could not connect to Google Drive.';
      setSyncError(errorMsg);
      showToast(`Sync notice: ${errorMsg.slice(0, 45)}...`);
    } finally {
      setIsDocsLoading(false);
    }
  };

  // Initialize App State
  useEffect(() => {
    // 1. Load saved reflections
    const saved = loadSavedReflections();
    setSavedReflections(saved);

    // 2. Load custom docs if any
    const custom = loadCustomDocs();
    if (custom.length > 0) {
      setDocs([...custom, ...SAMPLE_DOCS]);
    }

    // 3. Load daily pick if available for today
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyPick = loadDailyPick();
    if (dailyPick && dailyPick.date === todayStr && dailyPick.passage) {
      setCurrentPassage(dailyPick.passage);
    } else {
      const defaultPassage = getRandomSamplePassage('paragraph');
      setCurrentPassage(defaultPassage);
      saveDailyPick(defaultPassage);
    }

    // 4. Listen to Firebase Auth state
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        syncDriveDocs(token);
      },
      () => {
        // Not actively authenticated with token in memory
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, [getRandomSamplePassage]);

  // Google Sign In Handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await syncDriveDocs(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setSyncError(err?.message || 'Sign in was cancelled or failed.');
      showToast('Sign-in cancelled or failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSyncError(null);
    const custom = loadCustomDocs();
    setDocs(custom.length > 0 ? [...custom, ...SAMPLE_DOCS] : SAMPLE_DOCS);
    showToast('Signed out of Google account.');
  };

  // Draw a new reflection quote
  const handleDrawNew = async (type?: PassageType | 'all') => {
    const granularity = type || selectedGranularity;
    setIsPassageLoading(true);

    try {
      // 1. If user has active Google Drive docs and token
      if (user && accessToken && docs.length > 0 && docs.some((d) => !d.id.startsWith('sample-'))) {
        const passage = await drawRandomPassage(docs, accessToken, granularity);
        if (passage) {
          setCurrentPassage(passage);
          saveDailyPick(passage);
          showToast('Drew a new reflection from your documents.');
          setIsPassageLoading(false);
          return;
        }
      }

      // 2. Check if there are custom user notes/documents
      const customDocs = docs.filter((d) => d.id.startsWith('custom-'));
      if (customDocs.length > 0) {
        const randomCustom = customDocs[Math.floor(Math.random() * customDocs.length)];
        const savedRaw = localStorage.getItem(`epigraph_doc_text_${randomCustom.id}`);
        if (savedRaw) {
          const sentences = savedRaw.split(/(?<=[.!?])\s+/).filter((s) => s.length >= 30);
          if (sentences.length > 0) {
            const text = sentences[Math.floor(Math.random() * sentences.length)];
            const customPassage: ExtractedPassage = {
              id: `${randomCustom.id}-${Date.now()}`,
              text,
              docId: randomCustom.id,
              docTitle: randomCustom.name,
              docUrl: '#',
              wordCount: text.split(/\s+/).length,
              characterCount: text.length,
              passageType: 'line',
              extractedAt: new Date().toISOString(),
            };
            setCurrentPassage(customPassage);
            saveDailyPick(customPassage);
            showToast(`Drew quote from "${randomCustom.name}"`);
            setIsPassageLoading(false);
            return;
          }
        }
      }

      // 3. Fallback to sample classic quotes
      await new Promise((r) => setTimeout(r, 180));
      const passage = getRandomSamplePassage(granularity);
      setCurrentPassage(passage);
      saveDailyPick(passage);
      showToast('Drew a new reflection quote.');
    } catch (err) {
      console.error('Failed to draw quote:', err);
      const fallback = getRandomSamplePassage(granularity);
      setCurrentPassage(fallback);
    } finally {
      setIsPassageLoading(false);
    }
  };

  // Draw specifically from a chosen doc
  const handleDrawFromSpecificDoc = async (doc: DriveDoc) => {
    setIsPassageLoading(true);
    setActiveTab('reflect');

    try {
      if (doc.id.startsWith('custom-')) {
        const savedRaw = localStorage.getItem(`epigraph_doc_text_${doc.id}`);
        if (savedRaw) {
          const lines = savedRaw.split(/\n\s*\n/).filter((l) => l.trim().length >= 40);
          const chosen = lines[Math.floor(Math.random() * lines.length)] || savedRaw;
          const p: ExtractedPassage = {
            id: `${doc.id}-${Date.now()}`,
            text: chosen,
            docId: doc.id,
            docTitle: doc.name,
            docUrl: '#',
            wordCount: chosen.split(/\s+/).length,
            characterCount: chosen.length,
            passageType: 'paragraph',
            extractedAt: new Date().toISOString(),
          };
          setCurrentPassage(p);
          saveDailyPick(p);
          showToast(`Drew quote from "${doc.name}"`);
        }
      } else if (user && accessToken && !doc.id.startsWith('sample-')) {
        const passages = await fetchDocPassages(accessToken, doc);
        if (passages.length > 0) {
          let pool = passages;
          if (selectedGranularity !== 'all') {
            const filtered = passages.filter((p) => p.passageType === selectedGranularity);
            if (filtered.length > 0) pool = filtered;
          }
          const randomIdx = Math.floor(Math.random() * pool.length);
          const chosen = pool[randomIdx];
          setCurrentPassage(chosen);
          saveDailyPick(chosen);
          showToast(`Drew quote from "${doc.name}"`);
        } else {
          showToast(`No paragraphs found in "${doc.name}"`);
        }
      } else {
        const sample = getRandomSamplePassage(selectedGranularity, doc.id);
        setCurrentPassage(sample);
        saveDailyPick(sample);
        showToast(`Drew quote from "${doc.name}"`);
      }
    } catch (err) {
      console.error('Error drawing from specific doc:', err);
      showToast('Could not extract text from this document.');
    } finally {
      setIsPassageLoading(false);
    }
  };

  // Add custom writing/notes directly
  const handleAddCustomDoc = (title: string, text: string) => {
    const docId = `custom-${Date.now()}`;
    const newDoc: DriveDoc = {
      id: docId,
      name: title,
      mimeType: 'text/plain',
      modifiedTime: new Date().toISOString(),
      selectedForReflections: true,
    };

    localStorage.setItem(`epigraph_doc_text_${docId}`, text);
    const existing = loadCustomDocs();
    const updated = [newDoc, ...existing];
    saveCustomDocs(updated);

    setDocs((prev) => [newDoc, ...prev.filter((d) => d.id !== docId)]);
    showToast(`Added "${title}" to your reflection pool.`);
    handleDrawFromSpecificDoc(newDoc);
  };

  // Toggle document inclusion
  const handleToggleDoc = (docId: string) => {
    const updated = docs.map((d) =>
      d.id === docId ? { ...d, selectedForReflections: !d.selectedForReflections } : d
    );
    setDocs(updated);

    const settings = updated.reduce((acc, d) => {
      acc[d.id] = d.selectedForReflections !== false;
      return acc;
    }, {} as Record<string, boolean>);
    saveDocSelectionSettings(settings);
  };

  // Select / Deselect All docs
  const handleSelectAll = (select: boolean) => {
    const updated = docs.map((d) => ({ ...d, selectedForReflections: select }));
    setDocs(updated);

    const settings = updated.reduce((acc, d) => {
      acc[d.id] = select;
      return acc;
    }, {} as Record<string, boolean>);
    saveDocSelectionSettings(settings);
  };

  // Save Reflection & Journal Note
  const handleSaveReflection = (passage: ExtractedPassage, notes: string) => {
    const newEntry: ReflectionEntry = {
      id: `ref-${Date.now()}`,
      passage,
      reflectionNotes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      isFavorite: true,
    };
    saveReflectionEntry(newEntry);
    setSavedReflections(loadSavedReflections());
    showToast('Reflection saved to your personal archive.');
  };

  // Toggle Bookmark
  const handleToggleBookmark = (passage: ExtractedPassage) => {
    const existingIndex = savedReflections.findIndex((r) => r.passage.id === passage.id);
    if (existingIndex >= 0) {
      const entryId = savedReflections[existingIndex].id;
      deleteReflectionEntry(entryId);
      setSavedReflections(loadSavedReflections());
      showToast('Removed from saved reflections.');
    } else {
      const newEntry: ReflectionEntry = {
        id: `ref-${Date.now()}`,
        passage,
        createdAt: new Date().toISOString(),
        isFavorite: true,
      };
      saveReflectionEntry(newEntry);
      setSavedReflections(loadSavedReflections());
      showToast('Quote bookmarked in your archive.');
    }
  };

  // Delete Reflection Entry
  const handleDeleteReflection = (id: string) => {
    deleteReflectionEntry(id);
    setSavedReflections(loadSavedReflections());
    showToast('Reflection removed.');
  };

  const isCurrentBookmarked = Boolean(
    currentPassage && savedReflections.some((r) => r.passage.id === currentPassage.id)
  );

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-100 text-xs px-4 py-2.5 rounded-lg shadow-lg border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast}
        </div>
      )}

      {/* Top Bar Contract (Brand, Nav Links, Primary Action) */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        totalDocsCount={docs.length}
        savedReflectionsCount={savedReflections.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {activeTab === 'reflect' && (
          <div className="space-y-8">
            {/* Editorial Lead Section */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-sans">
                <Calendar className="w-3.5 h-3.5 text-amber-800" />
                <span>{todayFormatted}</span>
                <span aria-hidden="true">·</span>
                <span>Daily Reflection</span>
              </div>
              <h1
                className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-stone-900 leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Rediscover your thoughts.
              </h1>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                A daily quote drawn at random from your documents, manuscripts, and journals to
                pause, reflect, and renew your focus.
              </p>
            </div>

            {/* The Quote Card Canvas */}
            <QuoteCard
              passage={currentPassage}
              isLoading={isPassageLoading}
              onDrawNew={handleDrawNew}
              onSaveReflection={handleSaveReflection}
              isBookmarked={isCurrentBookmarked}
              onToggleBookmark={handleToggleBookmark}
              selectedGranularity={selectedGranularity}
              onSelectGranularity={(g) => {
                setSelectedGranularity(g);
                handleDrawNew(g);
              }}
              isGoogleConnected={Boolean(user && accessToken)}
            />

            {/* Quiet Context & Guidance Strip */}
            <div className="max-w-4xl mx-auto mt-10 pt-8 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600">
              <div className="space-y-1">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-amber-800" />
                  <span>Random Extraction</span>
                </p>
                <p className="text-stone-500 leading-relaxed">
                  Passages are parsed from Google Docs body content, headings, and paragraphs without
                  modifying your original files.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-800" />
                  <span>Direct Source Links</span>
                </p>
                <p className="text-stone-500 leading-relaxed">
                  Every card links directly to the exact file and section in Google Docs so you can
                  jump back into context.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                  <span>Private & Read-Only</span>
                </p>
                <p className="text-stone-500 leading-relaxed">
                  Read-only access with tokens maintained strictly in client memory. Your writing
                  remains entirely your own.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <LibraryView
            docs={docs}
            isLoading={isDocsLoading}
            onRefresh={() => syncDriveDocs()}
            onToggleDoc={handleToggleDoc}
            onSelectAll={handleSelectAll}
            onDrawFromSpecificDoc={handleDrawFromSpecificDoc}
            isGoogleConnected={Boolean(user && accessToken)}
            onLogin={handleLogin}
            isLoggingIn={isLoggingIn}
            syncError={syncError}
            onAddCustomDoc={handleAddCustomDoc}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveView
            reflections={savedReflections}
            onDeleteReflection={handleDeleteReflection}
            onSelectPassageToReflect={(entry) => {
              setCurrentPassage(entry.passage);
              setActiveTab('reflect');
            }}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-200/80 bg-stone-100/40 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>Epigraph · Daily reflections from your Google Docs and Drive library</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('reflect')}
              className="hover:text-stone-900 cursor-pointer"
            >
              Today's Quote
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('library')}
              className="hover:text-stone-900 cursor-pointer"
            >
              Document Pool
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('archive')}
              className="hover:text-stone-900 cursor-pointer"
            >
              Anthology Archive
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
