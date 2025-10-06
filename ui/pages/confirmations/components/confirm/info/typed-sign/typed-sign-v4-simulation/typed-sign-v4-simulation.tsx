import React from 'react';

import { isPermitSignatureRequest } from '../../../../../utils';
import { useDecodedSignatureMetrics } from '../../../../../hooks/useDecodedSignatureMetrics';
import { useTypesSignSimulationEnabledInfo } from '../../../../../hooks/useTypesSignSimulationEnabledInfo';
import { useSignatureRequestWithFallback } from '../../../../../hooks/signatures/useSignatureRequest';
import { DecodedSimulation } from './decoded-simulation';
import { PermitSimulation } from './permit-simulation';

const TypedSignV4Simulation: React.FC<object> = () => {
  const currentConfirmation = useSignatureRequestWithFallback();
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

  return <DecodedSimulation />;
};

export default TypedSignV4Simulation;
