import React from 'react';

/**
 * Error boundary for tests that need to capture errors thrown from children.
 * Use when testing components that throw on a subsequent render (e.g. after
 * useAsyncResult rejects), so the test can assert the error via waitFor instead
 * of expect().toThrow().
 *
 * Renders the caught error message in a div with data-testid="error-boundary".
 */
export const TestErrorBoundary = class extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <div data-testid="error-boundary">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
};
