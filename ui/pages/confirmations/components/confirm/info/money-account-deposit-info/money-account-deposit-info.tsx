import React from 'react';
import { useTriggerMoneyUpgrade } from '../../../../../../hooks/money/use-trigger-money-upgrade';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import {
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
} from '../../../../constants/musd';

const MONEY_ACCOUNT_DEPOSIT_CURRENCY = 'usd';

export const MoneyAccountDepositInfo = () => {
  useAddToken({
    chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  // A deposit reached without visiting the Money home page must still ensure
  // the account is upgraded, mirroring mobile's trigger on its confirmation
  // stack.
  useTriggerMoneyUpgrade({ enabled: true });

  return (
    <CustomAmountInfo
      autoFocusAmount
      currency={MONEY_ACCOUNT_DEPOSIT_CURRENCY}
      displayAccountRow
      displayPercentageButtons
      hidePayTokenAmount
    />
  );
};
