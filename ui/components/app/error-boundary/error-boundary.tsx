import React, { Component, ReactNode, ErrorInfo } from 'react';
import { captureException } from '../../../../shared/lib/sentry';
import { useI18nContext } from '../../../hooks/useI18nContext';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export function ErrorFallback() {
  const t = useI18nContext();
  return <p className="p-4 text-center">{t('somethingWentWrong')}</p>;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { extra: { ...errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
