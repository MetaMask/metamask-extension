import { isEvmAccountType } from '@metamask/keyring-api';
import {
  getSelectedAccountTokensAcrossChains,
  getCrossChainMetaMaskCachedBalances,
} from '..';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getSelectedInternalAccount } from '../accounts';
import { getMultichainAggregatedBalance } from '../assets';

export const getShouldShowSeedPhraseReminder = createDeepEqualSelector(
  (state) => state,
  getSelectedAccountTokensAcrossChains,
  getCrossChainMetaMaskCachedBalances,
  (state, account) => getMultichainAggregatedBalance(state, account),
  (state, tokens, crossChainBalances, aggregatedBalance) => {
    const { seedPhraseBackedUp, dismissSeedBackUpReminder } = state.metamask;
    const selectedAccount = getSelectedInternalAccount(state);

    // if there is no account, we don't need to show the seed phrase reminder
    if (!selectedAccount) {
      return false;
    }

    let hasBalance = false;

    if (isEvmAccountType(selectedAccount.type)) {
      hasBalance =
        Object.values(tokens).some(
          (token) => (token as { balance: number }).balance > 0,
        ) ||
        Object.values(crossChainBalances).some(
          (balance) => (balance as { balance: number }).balance > 0,
        );
    } else {
      hasBalance = aggregatedBalance(selectedAccount) > 0;
    }

    return (
      seedPhraseBackedUp === false &&
      hasBalance &&
      dismissSeedBackUpReminder === false
    );
  },
);
