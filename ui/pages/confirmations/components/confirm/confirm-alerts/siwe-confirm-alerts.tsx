import React, { type ReactElement } from 'react';
import useDomainMismatchAlerts from '../../../hooks/alerts/signatures/useDomainMismatchAlerts';
import ConfirmAlertsBase from './confirm-alerts-base';

const SiweConfirmAlerts = ({ children }: { children: ReactElement }) => {
  const domainMismatchAlerts = useDomainMismatchAlerts();

  return (
    <ConfirmAlertsBase domainMismatchAlerts={domainMismatchAlerts}>
      {children}
    </ConfirmAlertsBase>
  );
};

export default SiweConfirmAlerts;
