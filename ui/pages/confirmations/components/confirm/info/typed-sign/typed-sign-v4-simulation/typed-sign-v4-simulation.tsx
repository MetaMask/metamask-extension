import React from 'react';

import { parseTypedDataMessage } from '../../../../../../../../shared/modules/transaction.utils';
import { SignatureRequestType } from '../../../../../types/confirm';
import { useConfirmContext } from '../../../../../context/confirm';
import { isPermitSignatureRequest } from '../../../../../utils';
import { DecodedSimulation } from './decoded-simulation';
import { PermitSimulation } from './permit-simulation';

const NonPermitValidTypesSignRequestValues = {
  domainName: 'Seaport',
  primaryTypeList: ['BulkOrder', 'OrderComponents'],
  versionList: ['1.4', '1.5', '1.6'],
};

const isNonPermitRequestSupportedByDecodingAPI = (
  signatureRequest: SignatureRequestType,
) => {
  const {
    domain: { name, version },
    primaryType,
  } = parseTypedDataMessage(
    (signatureRequest as SignatureRequestType).msgParams?.data as string,
  );

  const { domainName, primaryTypeList, versionList } =
    NonPermitValidTypesSignRequestValues;

  return (
    name === domainName &&
    primaryTypeList.includes(primaryType) &&
    (!versionList || versionList.includes(version))
  );
};

const TypedSignV4Simulation: React.FC<object> = () => {
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const isPermit = isPermitSignatureRequest(currentConfirmation);
  const supportedByDecodingAPI =
    isNonPermitRequestSupportedByDecodingAPI(currentConfirmation) || isPermit;

  if (!supportedByDecodingAPI) {
    return null;
  }

  const { decodingData, decodingLoading } = currentConfirmation;

  if (
    ((decodingLoading === undefined && decodingData === undefined) ||
      decodingData?.error) &&
    isPermit
  ) {
    return <PermitSimulation />;
  }

  return <DecodedSimulation />;
};

export default TypedSignV4Simulation;
