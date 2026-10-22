import React, { useState } from 'react';
import {
  Bookmark,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Download,
  Search,
  PenLine,
  FileText,
  Calendar,
} from 'lucide-react';
import { ReflectionEntry } from '../types';

interface ArchiveViewProps {
  reflections: ReflectionEntry[];
  onDeleteReflection: (id: string) => void;
  onSelectPassageToReflect: (entry: ReflectionEntry) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  reflections,
  onDeleteReflection,
  onSelectPassageToReflect,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filtered = reflections.filter((entry) => {
    const q = search.toLowerCase();
    const textMatch = entry.passage.text.toLowerCase().includes(q);
    const titleMatch = entry.passage.docTitle.toLowerCase().includes(q);
    const notesMatch = entry.reflectionNotes?.toLowerCase().includes(q) || false;
    return textMatch || titleMatch || notesMatch;
  });

  const handleCopy = async (entry: ReflectionEntry) => {
    const text = `"${entry.passage.text}"\n\n— From "${entry.passage.docTitle}"\n${entry.passage.docUrl}${
      entry.reflectionNotes ? `\n\nMy Reflection: ${entry.reflectionNotes}` : ''
    }`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportMarkdown = () => {
    if (reflections.length === 0) return;

    let md = `# Epigraph — Daily Reflections & Quotes\n\nExported on ${new Date().toLocaleDateString()}\n\n---\n\n`;

    for (const r of reflections) {
      md += `### "${r.passage.docTitle}"\n`;
      if (r.passage.headingContext) {
        md += `*${r.passage.headingContext}*\n\n`;
      }
      md += `> ${r.passage.text.replace(/\n/g, '\n> ')}\n\n`;
      md += `[Open Document in Google Docs](${r.passage.docUrl})\n\n`;
      if (r.reflectionNotes) {
        md += `**Personal Reflection:**\n${r.reflectionNotes}\n\n`;
      }
      md += `*Saved: ${new Date(r.createdAt).toLocaleDateString()}*\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epigraph-reflections-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white/90 border border-stone-200/90 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              Saved Reflections Archive
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Your personal anthology of quotes, passages, and reflections gathered over time.
            </p>
          </div>

          {reflections.length > 0 && (
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exported Markdown</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to Markdown</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {reflections.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved reflections, quotes, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>
      )}

      {/* Reflections Grid / List */}
      {reflections.length === 0 ? (
        <div className="bg-white/80 border border-stone-200/90 rounded-xl p-16 text-center">
          <Bookmark className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="font-serif text-xl text-stone-800">Your archive is empty</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            When you encounter a passage you want to remember, click "Bookmark" or "Add Reflection"
            on the quote card to preserve it here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 border border-stone-200/90 rounded-xl p-12 text-center">
          <p className="font-serif text-lg text-stone-800">No reflections match "{search}"</p>
          <button
            onClick={() => setSearch('')}
            className="mt-2 text-xs text-amber-900 underline font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white/95 border border-stone-200/90 rounded-xl p-6 sm:p-7 shadow-xs hover:border-stone-300 transition-all"
            >
              {/* Document metadata line */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4 text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  <span className="font-medium text-stone-800 truncate max-w-xs sm:max-w-md">
                    {item.passage.docTitle}
                  </span>
                  {item.passage.headingContext && (
                    <>
                      <span aria-hidden="true" className="text-stone-300">
                        ·
                      </span>
                      <span className="italic truncate max-w-[200px]">
                        {item.passage.headingContext}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-stone-400">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Quote excerpt */}
              <blockquote className="my-3">
                <p className="font-serif text-base sm:text-lg text-stone-800 leading-relaxed italic">
                  "{item.passage.text}"
                </p>
              </blockquote>

              {/* Personal Reflection Notes (if any) */}
              {item.reflectionNotes && (
                <div className="mt-4 p-3.5 bg-stone-50/80 rounded-lg border border-stone-200/60 text-xs text-stone-700">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-900 mb-1">
                    <PenLine className="w-3 h-3 text-amber-800" />
                    <span>Personal Reflection</span>
                  </div>
                  <p className="whitespace-pre-line text-stone-600">{item.reflectionNotes}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <a
                  href={item.passage.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-900 hover:text-amber-700 font-medium"
                >
                  <span>Open Document</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectPassageToReflect(item)}
                    className="text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                    title="Bring this passage to the main reflection canvas"
                  >
                    View on Canvas
                  </button>

                  <button
                    onClick={() => handleCopy(item)}
                    className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
                    title="Copy reflection"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteReflection(item.id)}
                    className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
