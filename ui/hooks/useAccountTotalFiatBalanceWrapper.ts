import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { useAccountTotalFiatBalance } from './useAccountTotalFiatBalance';
import { useNonEvmAccountTotalFiatBalance } from './useNonEvmAccountTotalFiatBalance';

export const useAccountTotalFiatBalanceWrapper = (
  account: InternalAccount,
  shouldHideZeroBalanceTokens: boolean,
) => {
  if (isEvmAccountType(account.type)) {
    return useAccountTotalFiatBalance(
      account.address,
      shouldHideZeroBalanceTokens,
    );
  }
  return useNonEvmAccountTotalFiatBalance(
    account.id,
    shouldHideZeroBalanceTokens,
  );
};
