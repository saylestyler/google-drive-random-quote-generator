import React, { useState } from 'react';
import {
  ExternalLink,
  Shuffle,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  PenLine,
  Share2,
  FileText,
  RotateCw,
} from 'lucide-react';
import { ExtractedPassage, PassageType } from '../types';

interface QuoteCardProps {
  passage: ExtractedPassage | null;
  isLoading: boolean;
  onDrawNew: (type?: PassageType | 'all') => void;
  onSaveReflection: (passage: ExtractedPassage, notes: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (passage: ExtractedPassage) => void;
  selectedGranularity: PassageType | 'all';
  onSelectGranularity: (type: PassageType | 'all') => void;
  isGoogleConnected: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  passage,
  isLoading,
  onDrawNew,
  onSaveReflection,
  isBookmarked,
  onToggleBookmark,
  selectedGranularity,
  onSelectGranularity,
  isGoogleConnected,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJournalInput, setShowJournalInput] = useState(false);
  const [journalNotes, setJournalNotes] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const handleCopy = async () => {
    if (!passage) return;
    const textToCopy = `"${passage.text}"\n\n— From "${passage.docTitle}"${
      passage.headingContext ? ` (${passage.headingContext})` : ''
    }\n${passage.docUrl}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy quote:', err);
    }
  };

  const handleSaveNotes = () => {
    if (!passage) return;
    onSaveReflection(passage, journalNotes);
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      setShowJournalInput(false);
    }, 1200);
  };

  const formatGranularityLabel = (type: PassageType) => {
    switch (type) {
      case 'line':
        return 'Poetic Line';
      case 'section':
        return 'Multi-Paragraph Section';
      case 'paragraph':
      default:
        return 'Cohesive Paragraph';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Controls Bar: Granularity selector tabs + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Segmented Control for Passage Granularity */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-lg self-start">
          <button
            onClick={() => onSelectGranularity('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedGranularity === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Formats
          </button>
          <button
            onClick={() => onSelectGranularity('paragraph')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedGranularity === 'paragraph'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Paragraphs
          </button>
          <button
            onClick={() => onSelectGranularity('line')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedGranularity === 'line'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Single Lines
          </button>
          <button
            onClick={() => onSelectGranularity('section')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedGranularity === 'section'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sections
          </button>
        </div>

        {/* Primary Draw Button */}
        <button
          onClick={() => onDrawNew(selectedGranularity)}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 active:bg-stone-950 font-medium text-xs tracking-wide transition-all shadow-xs disabled:opacity-60 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Shuffle className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Drawing passage...' : 'Draw New Reflection'}</span>
        </button>
      </div>

      {/* Main Archival Reflection Card */}
      <div className="relative bg-white/90 border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
        {/* Subtle top archival rule */}
        <div className="h-1 bg-gradient-to-r from-amber-800/40 via-stone-400 to-amber-900/30" />

        <div className="p-7 sm:p-10 md:p-14">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RotateCw className="w-8 h-8 text-amber-800/70 animate-spin mb-4" />
              <p className="font-serif text-lg text-stone-700 italic">
                Searching your documents for a quiet thought...
              </p>
              <p className="text-xs text-stone-400 mt-1">Reading paragraphs and sections</p>
            </div>
          ) : passage ? (
            <div>
              {/* Document Kicker & Provenance (Clean unboxed metadata with separators) */}
              <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 border-b border-stone-100 pb-5 mb-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="flex items-center gap-1.5 font-medium text-stone-700">
                    <FileText className="w-3.5 h-3.5 text-amber-800" />
                    <span className="truncate max-w-[280px] sm:max-w-md">{passage.docTitle}</span>
                  </span>

                  {passage.headingContext && (
                    <>
                      <span aria-hidden="true" className="text-stone-300">
                        ·
                      </span>
                      <span className="italic text-stone-600 truncate max-w-[200px] sm:max-w-xs">
                        {passage.headingContext}
                      </span>
                    </>
                  )}

                  <span aria-hidden="true" className="text-stone-300">
                    ·
                  </span>
                  <span>{formatGranularityLabel(passage.passageType)}</span>
                </div>

                {/* Direct Document Link */}
                <a
                  href={passage.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:text-amber-700 transition-colors cursor-pointer group"
                  title="Open source document in Google Docs"
                >
                  <span>Open in Google Docs</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* The Quote Body */}
              <div className="relative my-6">
                <span
                  className="absolute -top-6 -left-3 font-serif text-6xl text-stone-200 select-none pointer-events-none"
                  aria-hidden="true"
                >
                  “
                </span>

                <blockquote className="relative z-10">
                  <p
                    className={`font-serif text-stone-800 font-normal leading-relaxed tracking-normal select-text ${
                      passage.passageType === 'line'
                        ? 'text-2xl sm:text-3xl md:text-4xl italic text-stone-900'
                        : passage.text.length > 500
                        ? 'text-lg sm:text-xl md:text-2xl whitespace-pre-line'
                        : 'text-xl sm:text-2xl md:text-3xl italic'
                    }`}
                    style={{ textWrap: 'balance' }}
                  >
                    {passage.text}
                  </p>
                </blockquote>
              </div>

              {/* Quiet Metadata Footer */}
              <div className="mt-8 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <span>{passage.wordCount} words</span>
                  <span aria-hidden="true">·</span>
                  <span>{passage.characterCount} characters</span>
                  {isGoogleConnected && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-stone-500">From your connected Google Docs</span>
                    </>
                  )}
                </div>

                {/* Secondary Action Cluster */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors text-xs font-medium cursor-pointer"
                    title="Copy quote and citation"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onToggleBookmark(passage)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-xs font-medium cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-50 text-amber-900'
                        : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark this quote'}
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-800" />
                        <span>Bookmarked</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Bookmark</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowJournalInput(!showJournalInput)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-xs font-medium cursor-pointer ${
                      showJournalInput
                        ? 'bg-stone-100 text-stone-900'
                        : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                    title="Write personal reflection note"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>{showJournalInput ? 'Close Journal' : 'Add Reflection'}</span>
                  </button>
                </div>
              </div>

              {/* Expandable In-Card Journal Reflection Prompt */}
              {showJournalInput && (
                <div className="mt-6 pt-6 border-t border-stone-200/80 bg-stone-50/60 -mx-7 sm:-mx-10 md:-mx-14 px-7 sm:px-10 md:px-14 pb-6">
                  <div className="max-w-2xl">
                    <label
                      htmlFor="journal-notes"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2 font-sans"
                    >
                      Personal Reflection & Daily Thought
                    </label>
                    <p className="text-xs text-stone-500 mb-3">
                      How does this passage speak to what you are building, studying, or thinking
                      today? Your notes are saved to your personal archive.
                    </p>
                    <textarea
                      id="journal-notes"
                      rows={3}
                      value={journalNotes}
                      onChange={(e) => setJournalNotes(e.target.value)}
                      placeholder="Write your observation, intention, or personal note here..."
                      className="w-full text-sm p-3.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
                    />

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-stone-400">
                        {journalNotes.length > 0 ? `${journalNotes.length} characters` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowJournalInput(false)}
                          className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNotes}
                          disabled={!journalNotes.trim() || justSaved}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {justSaved ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <span>Save Reflection</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-serif text-xl text-stone-700">No passage selected</p>
              <button
                onClick={() => onDrawNew()}
                className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs rounded-md font-medium"
              >
                Draw a Quote
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
