import React, { createContext, useContext, ReactNode } from 'react';
import {
  updateAlertMetrics,
  UseAlertSystemMetricsProps,
} from '../useAlertSystemMetrics';

type AlertMetricsContextType = (props: UseAlertSystemMetricsProps) => void;

const AlertMetricsContext = createContext<AlertMetricsContextType | null>(null);

type AlertMetricsProviderProps = {
  children: ReactNode;
};

export const AlertMetricsProvider: React.FC<AlertMetricsProviderProps> = ({
  children,
}) => {
  return (
    <AlertMetricsContext.Provider value={updateAlertMetrics}>
      {children}
    </AlertMetricsContext.Provider>
  );
};

export const useAlertMetrics = (): AlertMetricsContextType => {
  const context = useContext(AlertMetricsContext);
  if (context === null) {
    throw new Error(
      'useAlertMetrics must be used within an AlertMetricsProvider',
    );
  }
  return context;
};
