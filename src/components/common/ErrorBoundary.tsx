import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Leaf } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Invitation render error', error, info);
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="error-fallback">
          <Leaf aria-hidden="true" size={36} strokeWidth={1.25} />
          <p className="eyebrow">A small pause</p>
          <h1>The invitation could not open just now.</h1>
          <p>Please refresh the page. If the problem continues, contact the couple directly.</p>
          <button className="button button-dark" type="button" onClick={() => window.location.reload()}>
            Refresh invitation
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
