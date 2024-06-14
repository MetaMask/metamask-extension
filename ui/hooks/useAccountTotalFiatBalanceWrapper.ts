import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { useAccountTotalFiatBalance } from './useAccountTotalFiatBalance';
import { useMultichainAccountTotalFiatBalance } from './useMultichainAccountTotalFiatBalance';

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
  return useMultichainAccountTotalFiatBalance(account);
};
