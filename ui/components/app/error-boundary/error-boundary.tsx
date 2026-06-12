import React, { Component, ReactNode, ErrorInfo } from 'react';
import { captureException } from '../../../../shared/lib/sentry';
import { I18nContext } from '../../../contexts/i18n';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

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
      return (
        <I18nContext.Consumer>
          {(t) => <p className="p-4 text-center">{t('somethingWentWrong')}</p>}
        </I18nContext.Consumer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
