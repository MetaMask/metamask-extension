import React from 'react';

import { parseTypedDataMessage } from '../../../../../../../../shared/modules/transaction.utils';
import { SignatureRequestType } from '../../../../../types/confirm';
import { useConfirmContext } from '../../../../../context/confirm';
import { isPermitSignatureRequest } from '../../../../../utils';
import { DecodedSimulation } from './decoded-simulation';
import { PermitSimulation } from './permit-simulation';

const NonPermitValidTypesSignRequestValues = [
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

const isNonPermitRequestSupportedByDecodingAPI = (
  signatureRequest: SignatureRequestType,
) => {
  const {
    domain: { name, version },
    primaryType,
  } = parseTypedDataMessage(
    (signatureRequest as SignatureRequestType).msgParams?.data as string,
  );

  return NonPermitValidTypesSignRequestValues.some(
    ({ domainName, primaryTypeList, versionList }) =>
      name === domainName &&
      primaryTypeList.includes(primaryType) &&
      (!versionList || versionList.includes(version)),
  );
};

const TypedSignV4Simulation: React.FC<object> = () => {
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  console.log(JSON.stringify(currentConfirmation));
  const isPermit = isPermitSignatureRequest(currentConfirmation);
  const supportedByDecodingAPI =
    isNonPermitRequestSupportedByDecodingAPI(currentConfirmation) || isPermit;

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
