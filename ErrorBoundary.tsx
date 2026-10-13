import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  hasUnsavedChanges?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="font-bold text-lg">Não foi possível carregar esta tela</h2>
          <p className="mt-2">Confira sua conexão. Se o sistema foi atualizado, recarregue para abrir a versão atual.</p>
          {this.props.hasUnsavedChanges && <p className="mt-2 font-semibold">Há alterações pendentes. Use Salvar e aguarde a confirmação na nuvem antes de recarregar.</p>}
          <button type="button" disabled={this.props.hasUnsavedChanges} onClick={()=>window.location.reload()} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-white disabled:opacity-50">Recarregar sistema</button>
        </div>
      );
    }

    return this.props.children;
  }
}
