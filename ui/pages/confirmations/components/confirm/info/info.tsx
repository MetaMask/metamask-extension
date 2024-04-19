import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import { currentConfirmationSelector } from '../../../../../selectors';
import PersonalSignInfo from './personal-sign/personal-sign';
import TypedSignInfo from './typed-sign/typed-sign';
import TypedSignV1Info from './typed-sign-v1/typed-sign-v1';
import ContractInteraction from './contract-interaction/contract-interaction';
import { SignatureRequestType } from '../../../types/confirm';

const Info: React.FC = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  const ConfirmationInfoComponentMap = useMemo(
    () => ({
      [TransactionType.contractInteraction]: () => ContractInteraction,
      [TransactionType.personalSign]: () => PersonalSignInfo,
      [TransactionType.signTypedData]: () => {
        const { version } =
          (currentConfirmation as SignatureRequestType)?.msgParams ?? {};
        if (version === 'V1') {
          return TypedSignV1Info;
        }
        return TypedSignInfo;
      },
    }),
    [currentConfirmation],
  );

  if (!currentConfirmation?.type) {
    return null;
  }

  const InfoComponent =
    ConfirmationInfoComponentMap[
      currentConfirmation?.type as keyof typeof ConfirmationInfoComponentMap
    ]();

  return <InfoComponent />;
};

export default Info;
