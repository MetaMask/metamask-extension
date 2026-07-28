import React from 'react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { MAINNET_MUSD } from '../../../../constants/musd';

// Display the deposit amount in fiat ($) rather than the MUSD token symbol,
// matching the mobile "Add funds" screen.
const MONEY_ACCOUNT_DEPOSIT_CURRENCY = 'usd';

export const MoneyAccountDepositInfo = () => {
  useAddToken({
    chainId: MAINNET_MUSD.chainId,
    decimals: MAINNET_MUSD.decimals,
    symbol: MAINNET_MUSD.symbol,
    tokenAddress: MAINNET_MUSD.address,
  });

  return (
    <CustomAmountInfo
      autoFocusAmount
      currency={MONEY_ACCOUNT_DEPOSIT_CURRENCY}
      hidePayTokenAmount
    />
  );
};
