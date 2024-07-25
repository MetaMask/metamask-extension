import React, { createContext, useContext, ReactNode } from 'react';
import {
  ALERTS_NAME_METRICS,
  UseAlertSystemMetricsProps,
  useConfirmAlertMetrics,
} from '../useConfirmAlertMetrics';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';

const AlertMetricsContext = createContext<{
  trackAlertMetrics: (props?: UseAlertSystemMetricsProps) => void;
} | null>(null);

export const AlertMetricsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { trackAlertMetrics } = useConfirmAlertMetrics();

  return (
    <AlertMetricsContext.Provider value={{ trackAlertMetrics }}>
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
