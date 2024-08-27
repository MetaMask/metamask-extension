import React, { createContext, useContext, ReactNode, useMemo } from 'react';

const AlertMetricsContext = createContext<{
  trackAlertActionClicked: (alertKey: string) => void;
  trackAlertRender: (alertKey: string) => void;
  trackInlineAlertClicked: (alertKey: string) => void;
} | null>(null);

type AlertMetricsProps = {
  children: ReactNode;
  metrics: {
    trackAlertActionClicked: (alertKey: string) => void;
    trackAlertRender: (alertKey: string) => void;
    trackInlineAlertClicked: (alertKey: string) => void;
  };
};

export const AlertMetricsProvider: React.FC<AlertMetricsProps> = ({
  children,
  metrics,
}) => {
  const { trackAlertActionClicked, trackAlertRender, trackInlineAlertClicked } =
    metrics;

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
