import { isEvmAccountType } from '@metamask/keyring-api';
import {
  getSelectedAccountTokensAcrossChains,
  getCrossChainMetaMaskCachedBalances,
  getMetaMaskHdKeyrings,
} from '..';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getSelectedInternalAccount } from '../accounts';
import { getMultichainAggregatedBalance } from '../assets';
import { isMultichainWalletSnap } from '../../../shared/lib/accounts/snaps';
import { SnapId } from '@metamask/snaps-sdk';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';

type AccountInfo = {
  address: string;
  balance: string;
};

type AccountsByChainId = {
  [chainId: string]: {
    [address: string]: AccountInfo;
  };
};

type TokensByChainId = {
  [chainId: string]: {
    [address: string]: {
      balance: number;
    };
  };
};

const isPrimaryHdOrFirstPartySnapAccount = createDeepEqualSelector(
  (_state, account) => account,
  getMetaMaskHdKeyrings,
  (account, hdKeyrings) => {
    const [primaryKeyring] = hdKeyrings;

    if (
      primaryKeyring.accounts.find((address: string) =>
        isEqualCaseInsensitive(account.address, address),
      )
    ) {
      return true;
    }

    if (isMultichainWalletSnap(account.metadata.snap?.id as SnapId)) {
      return true;
    }
    return false;
  },
);

export const getShouldShowSeedPhraseReminder = createDeepEqualSelector(
  (state) => state,
  getSelectedAccountTokensAcrossChains,
  getCrossChainMetaMaskCachedBalances,
  (state, account) => getMultichainAggregatedBalance(state, account),
  isPrimaryHdOrFirstPartySnapAccount,
  (
    state,
    tokens: TokensByChainId,
    crossChainBalances: AccountsByChainId,
    aggregatedBalance,
    isPrimaryHdOrFirstPartySnapAccount,
  ) => {
    const { seedPhraseBackedUp, dismissSeedBackUpReminder } = state.metamask;
    const selectedAccount = getSelectedInternalAccount(state);

    // if there is no account, we don't need to show the seed phrase reminder
    if (!selectedAccount || !isPrimaryHdOrFirstPartySnapAccount) {
      return false;
    }

    let hasBalance = false;

    if (isEvmAccountType(selectedAccount.type)) {
      console.log('has aggregated balance', aggregatedBalance > 0);
      hasBalance =
        Object.values(tokens).some((chains) => {
          return (
            chains?.[selectedAccount.address as keyof typeof chains]?.balance &&
            Number(
              chains?.[selectedAccount.address as keyof typeof chains]?.balance,
            ) > 0
          );
        }) ||
        Object.values(crossChainBalances).some((chain) => {
          return (
            chain?.[selectedAccount.address as keyof typeof chain]?.balance &&
            Number(
              chain?.[selectedAccount.address as keyof typeof chain]?.balance,
            ) > 0
          );
        });
    } else {
      hasBalance = aggregatedBalance > 0;
    }

    const showMessage =
      seedPhraseBackedUp === false &&
      hasBalance &&
      dismissSeedBackUpReminder === false;

    return showMessage;
  },
);
