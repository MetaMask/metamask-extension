import React, { ReactElement } from 'react';
import { AlertActionHandlerProvider } from '../../../../../components/app/alert-system/contexts/alertActionHandler';
import useConfirmationAlertActions from '../../../hooks/useConfirmationAlertActions';
import useConfirmationAlerts from '../../../hooks/useConfirmationAlerts';
import { AlertMetricsProvider } from '../../../../../components/app/alert-system/contexts/alertMetricsContext';
import { useConfirmationAlertMetrics } from '../../../hooks/useConfirmationAlertMetrics';

const ConfirmAlerts = ({ children }: { children: ReactElement }) => {
  const { trackAlertActionClicked, trackAlertRender, trackInlineAlertClicked } =
    useConfirmationAlertMetrics();

  const processAction = useConfirmationAlertActions();
  useConfirmationAlerts();

  return (
    <AlertMetricsProvider
      metrics={{
        trackAlertActionClicked,
        trackAlertRender,
        trackInlineAlertClicked,
      }}
    >
      <AlertActionHandlerProvider onProcessAction={processAction}>
        {children}
      </AlertActionHandlerProvider>
    </AlertMetricsProvider>
  );
};

export default ConfirmAlerts;
