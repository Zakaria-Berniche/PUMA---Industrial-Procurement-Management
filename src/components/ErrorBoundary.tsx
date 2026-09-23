import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-slate-900/50 border-red-500/30">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl text-slate-50">Une erreur inattendue est survenue</CardTitle>
              <CardDescription className="text-slate-400">
                L'application a rencontré un problème qu'elle n'a pas pu gérer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="bg-slate-50 rounded-md p-4 border border-slate-800 overflow-x-auto text-left">
                <p className="text-red-400 text-sm font-mono mb-2">{this.state.error?.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="text-slate-500 text-xs font-mono mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  title="Recharger l'application"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-50 px-6 py-2 rounded-md font-semibold transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" /> Recharger l'application
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
