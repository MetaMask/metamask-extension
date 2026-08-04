import React from 'react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import {
  MUSD_DEVELOPER_HARNESS_CHAIN_ID,
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
} from '../../../../constants/musd';

const MONEY_ACCOUNT_DEPOSIT_CURRENCY = 'usd';

export const MoneyAccountDepositInfo = () => {
  useAddToken({
    // Matches the chain the developer deposit harness transacts on, so the
    // token being confirmed is the one registered here.
    chainId: MUSD_DEVELOPER_HARNESS_CHAIN_ID,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  return (
    <CustomAmountInfo
      autoFocusAmount
      currency={MONEY_ACCOUNT_DEPOSIT_CURRENCY}
      hidePayTokenAmount
    />
  );
};
