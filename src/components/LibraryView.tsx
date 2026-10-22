import React, { useState } from 'react';
import {
  FileText,
  Search,
  ExternalLink,
  Shuffle,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  Plus,
  Check,
  Info,
} from 'lucide-react';
import { DriveDoc } from '../types';

interface LibraryViewProps {
  docs: DriveDoc[];
  isLoading: boolean;
  onRefresh: () => void;
  onToggleDoc: (docId: string) => void;
  onSelectAll: (select: boolean) => void;
  onDrawFromSpecificDoc: (doc: DriveDoc) => void;
  isGoogleConnected: boolean;
  onLogin: () => void;
  isLoggingIn: boolean;
  syncError: string | null;
  onAddCustomDoc: (title: string, text: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  docs,
  isLoading,
  onRefresh,
  onToggleDoc,
  onSelectAll,
  onDrawFromSpecificDoc,
  isGoogleConnected,
  onLogin,
  isLoggingIn,
  syncError,
  onAddCustomDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');

  const filteredDocs = docs.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = docs.filter((d) => d.selectedForReflections !== false).length;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;
    onAddCustomDoc(customTitle.trim(), customContent.trim());
    setCustomTitle('');
    setCustomContent('');
    setShowAddCustom(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white/90 border border-stone-200/90 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              Document Library
            </h2>
            <p className="text-sm text-stone-600 mt-1 max-w-xl">
              Select which documents Epigraph draws quotes from. Every time you reflect, a random
              line, paragraph, or section is retrieved from your active documents.
            </p>
            <div className="flex items-center gap-3 text-xs text-stone-500 mt-3">
              <span>
                <strong className="text-stone-900 font-semibold">{selectedCount}</strong> of{' '}
                <strong className="text-stone-900 font-semibold">{docs.length}</strong> documents
                active
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isGoogleConnected ? 'Connected to your Google Drive' : 'Sample Library Mode'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isGoogleConnected ? (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Syncing Drive...' : 'Sync Google Drive'}</span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs shadow-xs"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isLoggingIn ? 'Connecting...' : 'Connect Google Drive'}
                  </span>
                </div>
              </button>
            )}

            <button
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Paste Notes</span>
            </button>
          </div>
        </div>

        {/* Sync Error / Troubleshooting Box */}
        {syncError && (
          <div className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-stone-900">Google Drive Sync Notice</p>
                <p className="mt-0.5 text-stone-700 font-mono text-[11px] bg-white/70 p-2 rounded border border-amber-200/60 break-words">
                  {syncError}
                </p>
                {syncError.toLowerCase().includes('disabled') ||
                syncError.toLowerCase().includes('has not been used') ? (
                  <p className="mt-2 text-stone-700 leading-relaxed">
                    The Google Drive API needs to be enabled for this Google Cloud project. You can
                    enable it with one click at{' '}
                    <a
                      href="https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=953699431915"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-amber-900"
                    >
                      Google Cloud Console · Drive API
                    </a>
                    .
                  </p>
                ) : syncError.toLowerCase().includes('401') ||
                  syncError.toLowerCase().includes('unauthorized') ||
                  syncError.toLowerCase().includes('credentials') ? (
                  <p className="mt-2 text-stone-700">
                    Your authorization session has expired. Click below to reconnect your account.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1 pl-6">
              <button
                onClick={onRefresh}
                className="px-3 py-1.5 bg-stone-900 text-stone-50 rounded-md font-medium text-xs hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Retry Sync
              </button>
              <button
                onClick={onLogin}
                className="px-3 py-1.5 border border-stone-300 bg-white text-stone-800 rounded-md font-medium text-xs hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Reconnect Google Account
              </button>
            </div>
          </div>
        )}

        {!isGoogleConnected && !syncError && (
          <div className="mt-5 pt-4 border-t border-stone-200/80 flex items-start gap-2.5 text-xs text-stone-600 bg-amber-50/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:p-6 rounded-b-xl">
            <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <p>
              You are currently viewing a curated sample collection of reflective manuscripts.
              Connect your Google account above to load your personal Google Docs into your daily
              reflection stream.
            </p>
          </div>
        )}
      </div>

      {/* Add Custom Document Drawer */}
      {showAddCustom && (
        <form
          onSubmit={handleCreateCustom}
          className="bg-white/95 border border-stone-200/90 rounded-xl p-6 sm:p-7 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              Add Personal Writing / Notes
            </h3>
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-stone-600">
            Paste an essay, journal entry, manuscript draft, or commonplace notes to include in
            your random reflections.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Autumn Journal 2026, Craft Reflections, Ideas..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 mb-1">
              Document Text (paragraphs & sections)
            </label>
            <textarea
              required
              rows={6}
              placeholder="Paste your writing or quotes here. Epigraph will extract paragraphs, single lines, and sections for daily reflections..."
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-serif leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 cursor-pointer"
            >
              Add to Reflection Pool
            </button>
          </div>
        </form>
      )}

      {/* Filter and Selection Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>

        {/* Batch Select Controls */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => onSelectAll(true)}
            className="text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
          >
            Select All
          </button>
          <span className="text-stone-300">·</span>
          <button
            onClick={() => onSelectAll(false)}
            className="text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white/90 border border-stone-200/90 rounded-xl overflow-hidden divide-y divide-stone-100">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-amber-800 animate-spin mx-auto mb-3" />
            <p className="font-serif text-base text-stone-700">Connecting to Google Drive...</p>
            <p className="text-xs text-stone-400 mt-1">Retrieving documents and manuscripts</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-serif text-lg text-stone-800">
              {searchQuery ? `No documents match "${searchQuery}"` : 'No documents found in Drive'}
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? 'Try clearing your search keyword.'
                : 'Your Google Drive did not return any Google Docs or text documents. You can create a Google Doc in Drive and hit "Sync Google Drive", or click "Paste Notes" above to add text directly.'}
            </p>
            {!searchQuery && (
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={onRefresh}
                  className="px-3.5 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-md hover:bg-stone-800 cursor-pointer"
                >
                  Retry Sync
                </button>
                <button
                  onClick={() => setShowAddCustom(true)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-stone-300 rounded-md hover:bg-stone-50 cursor-pointer"
                >
                  Paste Notes
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = doc.selectedForReflections !== false;
            return (
              <div
                key={doc.id}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                  isSelected ? 'hover:bg-stone-50/70' : 'bg-stone-50/40 opacity-75'
                }`}
              >
                {/* Left: Checkbox & Document Title */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleDoc(doc.id)}
                    className="mt-0.5 sm:mt-0 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                    title={isSelected ? 'Exclude from reflections' : 'Include in reflections'}
                    aria-label={`Toggle inclusion for ${doc.name}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-stone-900" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {doc.name.replace(/\.gdoc$/, '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span>Updated {formatDate(doc.modifiedTime)}</span>
                      <span aria-hidden="true">·</span>
                      <span className={isSelected ? 'text-stone-600' : 'text-stone-400 italic'}>
                        {isSelected ? 'Active in reflection pool' : 'Excluded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onDrawFromSpecificDoc(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors cursor-pointer"
                    title={`Draw a random quote specifically from ${doc.name}`}
                  >
                    <Shuffle className="w-3 h-3 text-amber-800" />
                    <span className="hidden sm:inline">Draw from this doc</span>
                  </button>

                  {doc.webViewLink && (
                    <a
                      href={doc.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors"
                      title="Open in Google Docs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
