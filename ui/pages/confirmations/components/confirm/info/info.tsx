import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import { currentConfirmationSelector } from '../../../../../selectors';
import PersonalSignInfo from './personal-sign/personal-sign';
import TypedSignInfo from './typed-sign/typed-sign';

const ConfirmationInfoConponentMap = {
  [TransactionType.personalSign]: PersonalSignInfo,
  [TransactionType.signTypedData]: TypedSignInfo,
};

type ConfirmationType = keyof typeof ConfirmationInfoConponentMap;

const Info: React.FC = memo(() => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  if (!currentConfirmation?.type) {
    return null;
  }

  const InfoComponent =
    ConfirmationInfoConponentMap[currentConfirmation?.type as ConfirmationType];

  return <InfoComponent />;
});

export default Info;
