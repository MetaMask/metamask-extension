import React from 'react';
import { useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import { currentConfirmationSelector } from '../../../../../selectors';
import PersonalSignInfo from './personal-sign/personal-sign';
import TypedSignInfo from './typed-sign/typed-sign';
import TypedSignV1Info from './typed-sign-v1/typed-sign-v1';

const ConfirmationInfoConponentMap = {
  [TransactionType.personalSign]: PersonalSignInfo,
  [TransactionType.signTypedData]: TypedSignInfo,
};

type ConfirmationType = keyof typeof ConfirmationInfoConponentMap;

const Info: React.FC = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  if (!currentConfirmation?.type) {
    return null;
  }

  let InfoComponent =
    ConfirmationInfoConponentMap[currentConfirmation?.type as ConfirmationType];

  if (currentConfirmation.type === TransactionType.signTypedData) {
    const { version } = currentConfirmation?.msgParams ?? {};
    if (version === 'V1') {
      InfoComponent = TypedSignV1Info;
    }
  }

  return <InfoComponent />;
};

export default Info;
