import React from 'react';

import { SignatureRequestType } from '../../../../../types/confirm';
import { useConfirmContext } from '../../../../../context/confirm';
import { DefaultSimulation } from './default-simulation';
import { DecodedSimulation } from './decoded-simulation';

const PermitSimulation: React.FC<object> = () => {
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const { decodingLoading, decodingData } = currentConfirmation;

  if (
    decodingData?.error ||
    (decodingData?.stateChanges === undefined && decodingLoading !== true)
  ) {
    return <DefaultSimulation />;
  }

  return <DecodedSimulation />;
};

export default PermitSimulation;
