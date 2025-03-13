import React, { createContext, useContext, ReactNode, useMemo } from 'react';

type TrackFunctionType = (alertKey: string) => void;

const AlertMetricsContext = createContext<{
  trackAlertActionClicked: TrackFunctionType;
  trackAlertRender: TrackFunctionType;
  trackInlineAlertClicked: TrackFunctionType;
} | null>(null);

type AlertMetricsProps = {
  children: ReactNode;
  metrics: {
    trackAlertActionClicked: TrackFunctionType;
    trackAlertRender: TrackFunctionType;
    trackInlineAlertClicked: TrackFunctionType;
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
