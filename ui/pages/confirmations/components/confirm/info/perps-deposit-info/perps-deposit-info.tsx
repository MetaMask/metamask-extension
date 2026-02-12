import React from 'react';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { PERPS_CURRENCY } from '../../../../constants/perps';

export const PerpsDepositInfo = () => {
  return <CustomAmountInfo currency={PERPS_CURRENCY} hasMax />;
};
