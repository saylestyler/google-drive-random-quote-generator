import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { LogOut, BookOpen, Layers, Bookmark, FileText, Check } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  activeTab: 'reflect' | 'library' | 'archive';
  setActiveTab: (tab: 'reflect' | 'library' | 'archive') => void;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  totalDocsCount: number;
  savedReflectionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogin,
  onLogout,
  isLoggingIn,
  totalDocsCount,
  savedReflectionsCount,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="border-b border-stone-200/80 bg-[#FBF9F5]/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (single text element wordmark in display face) */}
        <button
          onClick={() => setActiveTab('reflect')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors whitespace-nowrap shrink-0">
            Epigraph
          </span>
        </button>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('reflect')}
            className={`pb-0.5 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reflect'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daily Reflection</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`pb-0.5 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'library'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Document Library</span>
            {totalDocsCount > 0 && (
              <span className="text-xs font-mono text-stone-400">({totalDocsCount})</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`pb-0.5 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'archive'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Reflections</span>
            {savedReflectionsCount > 0 && (
              <span className="text-xs font-mono text-stone-400">({savedReflectionsCount})</span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1 pl-2 pr-3 rounded-lg border border-stone-300/80 bg-white hover:bg-stone-50 transition-colors text-xs font-medium text-stone-800 focus:outline-none"
                aria-label="User profile menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-serif text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[120px] truncate hidden sm:inline">
                  {user.displayName || user.email}
                </span>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-medium text-stone-900 truncate">
                        {user.displayName || 'Connected User'}
                      </p>
                      <p className="text-xs text-stone-500 truncate mt-0.5">{user.email}</p>
                    </div>

                    <div className="px-2 py-1">
                      <button
                        onClick={() => {
                          setActiveTab('library');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 rounded flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                        <span>Manage Connected Docs</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-2 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Google Account</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="gsi-material-button text-xs shadow-xs"
              title="Connect your Google Drive and Docs"
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
                  {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav rail */}
      <div className="flex md:hidden items-center justify-around border-t border-stone-200/60 py-2.5 bg-stone-50/70 text-xs text-stone-600">
        <button
          onClick={() => setActiveTab('reflect')}
          className={`flex items-center gap-1.5 ${
            activeTab === 'reflect' ? 'font-semibold text-stone-900' : 'text-stone-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reflect</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 ${
            activeTab === 'library' ? 'font-semibold text-stone-900' : 'text-stone-600'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Docs ({totalDocsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-1.5 ${
            activeTab === 'archive' ? 'font-semibold text-stone-900' : 'text-stone-600'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved ({savedReflectionsCount})</span>
        </button>
      </div>
    </header>
  );
};
