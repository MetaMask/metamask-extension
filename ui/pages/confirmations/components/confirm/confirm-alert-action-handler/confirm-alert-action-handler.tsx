import React, { ReactElement } from 'react';
import { AlertActionHandlerProvider } from '../../../../../components/app/alert-system/contexts/alertActionHandler';
import useConfirmationAlertActions from '../../../hooks/useConfirmationAlertActions';
import setConfirmationAlerts from '../../../hooks/setConfirmationAlerts';

export const ConfirmAlertActionHandler = ({
  children,
}: {
  children: ReactElement;
}) => {
  const processAction = useConfirmationAlertActions();
  setConfirmationAlerts();

  return (
    <AlertActionHandlerProvider onProcessAction={processAction}>
      {children}
    </AlertActionHandlerProvider>
  );
};
