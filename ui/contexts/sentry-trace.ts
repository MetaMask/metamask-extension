import { Span } from '@sentry/types';
import React, {
  createContext,
  useContext,
  useRef,
  ReactNode,
  useCallback,
  ComponentType,
} from 'react';

type SentryTraceContextType = {
  onboardingParentContext: React.RefObject<Span>;
  updateOnboardingParentContext: (span: Span) => void;
};

export const SentryTraceContext = createContext<SentryTraceContextType | null>(
  null,
);

type SentryTraceProviderProps = {
  children: ReactNode;
};

export const SentryTraceProvider = ({ children }: SentryTraceProviderProps) => {
  const onboardingParentContext = useRef<Span | null>(null);

  const updateOnboardingParentContext = useCallback((span: Span) => {
    onboardingParentContext.current = span;
  }, []);

  const value = {
    onboardingParentContext,
    updateOnboardingParentContext,
  };

  return React.createElement(SentryTraceContext.Provider, { value }, children);
};

export const useSentryTrace = (): SentryTraceContextType => {
  const context = useContext(SentryTraceContext);

  if (context === null) {
    throw new Error('useSentryTrace must be used within a SentryTraceProvider');
  }

  return context;
};

/**
 * HOC for class components to access SentryTraceContext
 *
 * @param WrappedComponent - Component to wrap
 */
export function withSentryTrace<P>(
  WrappedComponent: ComponentType<P & SentryTraceContextType>,
): ComponentType<P> {
  const WithSentryTrace = (props: P) => {
    const sentryTraceContext = useSentryTrace();

    return React.createElement(WrappedComponent, {
      ...props,
      onboardingParentContext: sentryTraceContext.onboardingParentContext,
      updateOnboardingParentContext:
        sentryTraceContext.updateOnboardingParentContext,
    });
  };

  WithSentryTrace.displayName = `withSentryTrace(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithSentryTrace;
}
