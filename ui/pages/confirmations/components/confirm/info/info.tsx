import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import { Box } from '../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { currentConfirmationSelector } from '../../../../../selectors';
import PersonalSignInfo from './personal-sign/personalSign';

const ConfirmationInfoConponentMap = {
  [TransactionType.personalSign]: PersonalSignInfo,
};

type ConfirmationType = keyof typeof ConfirmationInfoConponentMap;

const Info: React.FC = memo(() => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  if (!currentConfirmation?.type) {
    return null;
  }

  const InfoComponent =
    ConfirmationInfoConponentMap[currentConfirmation?.type as ConfirmationType];

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={2}
      marginBottom={4}
    >
      <InfoComponent />
    </Box>
  );
});

export default Info;
