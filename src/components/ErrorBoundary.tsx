import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6 text-stone-900 font-sans">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 shadow-xs text-center space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">Epigraph</h2>
            <p className="text-sm text-stone-600">
              An unexpected display issue occurred while loading this view.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono text-stone-500 bg-stone-50 p-3 rounded-lg overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-stone-900 text-stone-50 text-xs rounded-lg font-medium hover:bg-stone-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
