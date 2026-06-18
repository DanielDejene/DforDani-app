/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear(); // Clear potentially corrupt local storage as fallback
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#0c101b] border border-rose-500/20 rounded-2xl mx-auto max-w-2xl my-12" id="error-boundary-screen">
          <div className="text-center space-y-6">
            <div className="p-4 bg-rose-500/10 text-rose-450 border border-rose-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight font-sans">App View Render Interrupted</h2>
              <p className="text-sm text-slate-400 font-sans leading-relaxed max-w-md">
                An unexpected incompatibility or local state cache mismatch caused the active view to fail rendering.
              </p>
              {this.state.error && (
                <pre className="text-[10px] font-mono p-3 bg-black/40 text-rose-300 rounded-lg max-w-lg overflow-x-auto text-left mx-auto max-h-40">
                  {this.state.error.message || String(this.state.error)}
                </pre>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer text-xs font-sans flex items-center gap-2"
                id="error-boundary-retry-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Render
              </button>
              
              <button
                onClick={this.handleReset}
                className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer text-xs font-sans"
                id="error-boundary-clear-btn"
              >
                Reset Local Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
