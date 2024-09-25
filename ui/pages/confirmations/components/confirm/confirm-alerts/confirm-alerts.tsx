import React, { ReactElement } from 'react';
import { AlertActionHandlerProvider } from '../../../../../components/app/alert-system/contexts/alertActionHandler';
import useConfirmationAlertActions from '../../../hooks/useConfirmationAlertActions';
import setConfirmationAlerts from '../../../hooks/setConfirmationAlerts';
import { AlertMetricsProvider } from '../../../../../components/app/alert-system/contexts/alertMetricsContext';

const ConfirmAlerts = ({ children }: { children: ReactElement }) => {
  const processAction = useConfirmationAlertActions();
  setConfirmationAlerts();

  return (
    <AlertMetricsProvider>
      <AlertActionHandlerProvider onProcessAction={processAction}>
        {children}
      </AlertActionHandlerProvider>
    </AlertMetricsProvider>
  );
};

export default ConfirmAlerts;
