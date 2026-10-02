import React, { ReactElement } from 'react';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { AlertActionHandlerProvider } from '../../../../../components/app/alert-system/contexts/alertActionHandler';
import useConfirmationAlertActions from '../../../hooks/useConfirmationAlertActions';
import useSetConfirmationAlerts from '../../../hooks/useSetConfirmationAlerts';
import { AlertMetricsProvider } from '../../../../../components/app/alert-system/contexts/alertMetricsContext';
import { useConfirmationAlertMetrics } from '../../../hooks/useConfirmationAlertMetrics';

const ConfirmAlertsBase = ({
  children,
  domainMismatchAlerts,
}: {
  children: ReactElement;
  domainMismatchAlerts?: Alert[];
}) => {
  const { trackAlertActionClicked, trackAlertRender, trackInlineAlertClicked } =
    useConfirmationAlertMetrics();

  const processAction = useConfirmationAlertActions();
  useSetConfirmationAlerts(domainMismatchAlerts);

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

export default ConfirmAlertsBase;
