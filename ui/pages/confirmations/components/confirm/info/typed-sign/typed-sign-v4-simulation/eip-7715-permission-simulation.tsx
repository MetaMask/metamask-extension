import React from 'react';

import { SignatureRequestType } from '../../../../../types/confirm';
import { isPermitSignatureRequest } from '../../../../../utils';
import { useConfirmContext } from '../../../../../context/confirm';
import { useDecodedSignatureMetrics } from '../../../../../hooks/useDecodedSignatureMetrics';
import { useTypesSignSimulationEnabledInfo } from '../../../../../hooks/useTypesSignSimulationEnabledInfo';
import { PermitSimulation } from './permit-simulation';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';

const Eip7715PermissionSimulation: React.FC<object> = () => {
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const isPermit = isPermitSignatureRequest(currentConfirmation);
  const isSimulationSupported = useTypesSignSimulationEnabledInfo();
  useDecodedSignatureMetrics(isSimulationSupported === true);

  if (!isSimulationSupported) {
    return null;
  }

  const { decodingData, decodingLoading } = currentConfirmation;

  if (
    ((!decodingLoading && decodingData === undefined) || decodingData?.error) &&
    isPermit
  ) {
    return <PermitSimulation />;
  }

  const permissionStateChange = decodingData?.stateChanges?.find(
    (c) => (c.changeType as any) === 'PERMISSION',
  );

  if (permissionStateChange === undefined) {
    // todo: we should reject the request, as this is an unsanctioned permission signature request
    throw new Error('Permission state change is undefined');
  }

  const {
    permissionType,
    assetType,
    address,
    amount,
    cadence,
    startTime,
    expiry,
  } = permissionStateChange as any;

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Type">{permissionType}</ConfirmInfoRow>
      <ConfirmInfoRow label="Token">{assetType}</ConfirmInfoRow>
      <ConfirmInfoRow
        label="To"
        tooltip="The address of the account that is being granted permission"
      >
        {address}
      </ConfirmInfoRow>
      <ConfirmInfoRow label="Amount">{amount + ' ' + cadence}</ConfirmInfoRow>
      <ConfirmInfoRow label="Start Time">{startTime}</ConfirmInfoRow>
      <ConfirmInfoRow label="Expiry">{expiry}</ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export default Eip7715PermissionSimulation;
