import log from 'loglevel';
import { Component, ReactNode, ErrorInfo } from 'react';

type ErrorBoundaryProps = { children: ReactNode; fallback: () => ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class NFTGridItemErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error(
      'NFTGridItemErrorBoundary - failed to render NFTGridItem caught an error',
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      // Render the fallback UI
      return this.props.fallback();
    }

    return this.props.children;
  }
}

export default NFTGridItemErrorBoundary;
