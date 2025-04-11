import type { ReactElement } from 'react';
import React from 'react';

import { AlertActionHandlerProvider } from '../../../../../components/app/alert-system/contexts/alertActionHandler';
import { AlertMetricsProvider } from '../../../../../components/app/alert-system/contexts/alertMetricsContext';
import setConfirmationAlerts from '../../../hooks/setConfirmationAlerts';
import useConfirmationAlertActions from '../../../hooks/useConfirmationAlertActions';
import { useConfirmationAlertMetrics } from '../../../hooks/useConfirmationAlertMetrics';

const ConfirmAlerts = ({ children }: { children: ReactElement }) => {
  const { trackAlertActionClicked, trackAlertRender, trackInlineAlertClicked } =
    useConfirmationAlertMetrics();

  const processAction = useConfirmationAlertActions();
  setConfirmationAlerts();

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
