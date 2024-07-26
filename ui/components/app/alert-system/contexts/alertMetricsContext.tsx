import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import {
  UseAlertSystemMetricsProps,
  useConfirmationAlertMetrics,
} from '../../../../pages/confirmations/hooks/useConfirmationAlertMetrics';

const AlertMetricsContext = createContext<{
  trackAlertMetrics: (props?: UseAlertSystemMetricsProps) => void;
} | null>(null);

export const AlertMetricsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { trackAlertMetrics } = useConfirmationAlertMetrics();

  const value = useMemo(() => ({ trackAlertMetrics }), [trackAlertMetrics]);

  return (
    <AlertMetricsContext.Provider value={value}>
      {children}
    </AlertMetricsContext.Provider>
  );
};

export const useAlertMetrics = () => {
  const context = useContext(AlertMetricsContext);
  if (!context) {
    throw new Error(
      'useAlertMetrics must be used within an AlertMetricsProvider',
    );
  }
  return context;
};
