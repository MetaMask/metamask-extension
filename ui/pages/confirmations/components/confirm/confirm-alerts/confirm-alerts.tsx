import React, { type ReactElement, Suspense } from 'react';
import LoadingScreen from '../../../../../components/ui/loading-screen/loading-screen.component';
import { mmLazy } from '../../../../../helpers/utils/mm-lazy';
import { useConfirmContext } from '../../../context/confirm';
import { isSIWESignatureRequest } from '../../../utils/confirm';
import ConfirmAlertsBase from './confirm-alerts-base';

const SiweConfirmAlerts = mmLazy(() => import('./siwe-confirm-alerts'));

const ConfirmAlerts = ({ children }: { children: ReactElement }) => {
  const { currentConfirmation } = useConfirmContext();

  if (isSIWESignatureRequest(currentConfirmation)) {
    // Validation must load before the request details and approval controls.
    return (
      <Suspense fallback={<LoadingScreen />}>
        <SiweConfirmAlerts>{children}</SiweConfirmAlerts>
      </Suspense>
    );
  }

  return <ConfirmAlertsBase>{children}</ConfirmAlertsBase>;
};

export default ConfirmAlerts;
