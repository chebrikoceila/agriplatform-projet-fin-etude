import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Une erreur est survenue</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error?.message ?? "Erreur inconnue"}
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline">Réessayer</Button>
            <Button onClick={() => window.location.reload()}>Recharger la page</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
