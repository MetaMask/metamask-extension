import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useConfirmationAlertMetrics } from '../../../../pages/confirmations/hooks/useConfirmationAlertMetrics';

const AlertMetricsContext = createContext<{
  trackAlertActionClicked: (alertKey: string) => void;
  trackAlertRender: (alertKey: string) => void;
  trackInlineAlertClicked: (alertKey: string) => void;
} | null>(null);

export const AlertMetricsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { trackAlertActionClicked, trackAlertRender, trackInlineAlertClicked } =
    useConfirmationAlertMetrics();

  const value = useMemo(
    () => ({
      trackAlertActionClicked,
      trackAlertRender,
      trackInlineAlertClicked,
    }),
    [trackAlertActionClicked, trackAlertRender, trackInlineAlertClicked],
  );

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
