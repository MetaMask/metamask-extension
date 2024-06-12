import React, { ReactElement } from 'react';
import { AlertActionHandlerProvider } from '../../../../../components/app/alert-system/contexts/alertActionHandler';
import useConfirmationAlertActions from '../../../hooks/useConfirmationAlertActions';

export const ConfirmAlertActionHandler = ({
  children,
}: {
  children: ReactElement;
}) => {
  const processAction = useConfirmationAlertActions();

  return (
    <AlertActionHandlerProvider onProcessAction={processAction}>
      {children}
    </AlertActionHandlerProvider>
  );
};
