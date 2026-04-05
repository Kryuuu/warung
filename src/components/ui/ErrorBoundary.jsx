import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Ops! Terjadi Kesalahan</h2>
          <p className="text-sm text-red-600 dark:text-red-300/70 text-center max-w-md mb-6">
            Halaman ini mengalami gangguan teknis. Kami telah mencatat kesalahannya.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-600/20"
          >
            Refresh Halaman
          </button>
          <details className="mt-8 w-full max-w-lg">
            <summary className="text-[10px] text-red-400 uppercase tracking-widest cursor-pointer hover:underline">Detail Error (Developer Insight)</summary>
            <pre className="mt-2 p-4 bg-black/90 text-red-500 text-[10px] rounded-xl overflow-x-auto font-mono leading-loose whitespace-pre-wrap">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
