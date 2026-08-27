import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('KrishiLink ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-md">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-2">
            कुछ अप्रत्याशित त्रुटि हुई (Unexpected Error)
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
            पेज लोड करने में समस्या आई है। कृपया पुनः प्रयास करें या होम पेज पर जाएं।
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition active:scale-95 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>पुनः लोड करें (Reload)</span>
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-darkbg-card dark:hover:bg-darkbg-hover text-gray-800 dark:text-white rounded-xl font-bold flex items-center gap-2 transition active:scale-95 text-sm"
            >
              <Home className="w-4 h-4" />
              <span>मुख्य पृष्ठ (Home)</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
