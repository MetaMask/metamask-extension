import log from 'loglevel';
import { Component, ReactNode, ErrorInfo } from 'react';

type ErrorBoundaryProps = { children: ReactNode; fallback: () => ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Error boundary wrapping a single notification list item.
 *
 * Notification API responses are not guaranteed to match the shapes our
 * notification components expect (e.g. missing `template` or
 * `payload.data.amount` fields). A single malformed notification would
 * otherwise throw during render and crash the entire wallet UI, so we catch
 * the error here and skip rendering that one notification instead.
 */
class NotificationsListItemErrorBoundary extends Component<
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
      'NotificationsListItemErrorBoundary - failed to render a notification list item',
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

export default NotificationsListItemErrorBoundary;
