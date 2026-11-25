import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let displayMsg = error.message || 'Terjadi kesalahan pada aplikasi.';
    try {
      const parsed = JSON.parse(displayMsg) as { error?: string };
      if (parsed && typeof parsed.error === 'string') {
        displayMsg = parsed.error;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: displayMsg };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-display text-lg font-bold text-slate-900">
              Terjadi Gangguan Sistem
            </h1>
            <p className="mt-2 text-sm text-slate-600 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
