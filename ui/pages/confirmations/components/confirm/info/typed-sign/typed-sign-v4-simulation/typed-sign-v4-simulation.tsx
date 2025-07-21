import React from 'react';

import { PRIMARY_TYPES_PERMIT } from '../../../../../../../../shared/constants/signatures';
import { parseTypedDataMessage } from '../../../../../../../../shared/modules/transaction.utils';
import { SignatureRequestType } from '../../../../../types/confirm';
import { isPermitSignatureRequest } from '../../../../../utils';
import { useConfirmContext } from '../../../../../context/confirm';
import { useDecodedSignatureMetrics } from '../../../../../hooks/useDecodedSignatureMetrics';
import { DecodedSimulation } from './decoded-simulation';
import { PermitSimulation } from './permit-simulation';

const NON_PERMIT_SUPPORTED_TYPES_SIGNS = [
  {
    domainName: 'Seaport',
    primaryTypeList: ['BulkOrder'],
    versionList: ['1.4', '1.5', '1.6'],
  },
  {
    domainName: 'Seaport',
    primaryTypeList: ['OrderComponents'],
  },
];

const isSupportedByDecodingAPI = (signatureRequest: SignatureRequestType) => {
  const {
    domain: { name, version },
    primaryType,
  } = parseTypedDataMessage(
    (signatureRequest as SignatureRequestType).msgParams?.data as string,
  );
  const isPermit = PRIMARY_TYPES_PERMIT.includes(primaryType);
  const nonPermitSupportedTypes = NON_PERMIT_SUPPORTED_TYPES_SIGNS.some(
    ({ domainName, primaryTypeList, versionList }) =>
      name === domainName &&
      primaryTypeList.includes(primaryType) &&
      (!versionList || versionList.includes(version)),
  );
  return isPermit || nonPermitSupportedTypes;
};

const TypedSignV4Simulation: React.FC<object> = () => {
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const isPermit = isPermitSignatureRequest(currentConfirmation);
  const supportedByDecodingAPI = isSupportedByDecodingAPI(currentConfirmation);
  useDecodedSignatureMetrics();

  if (!supportedByDecodingAPI) {
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
