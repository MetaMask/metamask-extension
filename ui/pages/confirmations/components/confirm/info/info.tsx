import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import { currentConfirmationSelector } from '../../../../../selectors';
import PersonalSignInfo from './personal-sign/personal-sign';
import TypedSignInfo from './typed-sign/typed-sign';
import TypedSignV1Info from './typed-sign-v1/typed-sign-v1';

const Info: React.FC = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  const ConfirmationInfoComponentMap = useMemo(
    () => ({
      [TransactionType.personalSign]: () => PersonalSignInfo,
      [TransactionType.signTypedData]: () => {
        const { version } = currentConfirmation?.msgParams ?? {};
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
