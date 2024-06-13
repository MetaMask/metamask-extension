import React, { ReactElement } from 'react';
import { AlertActionHandlerProvider } from '../../../../../components/app/alert-system/contexts/alertActionHandler';
import useConfirmationAlertActions from '../../../hooks/useConfirmationAlertActions';
import setConfirmationAlerts from '../../../hooks/setConfirmationAlerts';

const ConfirmAlerts = ({ children }: { children: ReactElement }) => {
  const processAction = useConfirmationAlertActions();
  setConfirmationAlerts();

  return (
    <AlertActionHandlerProvider onProcessAction={processAction}>
      {children}
    </AlertActionHandlerProvider>
  );
};

export default ConfirmAlerts;
