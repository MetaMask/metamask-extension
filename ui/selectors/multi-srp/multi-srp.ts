import { isEvmAccountType } from '@metamask/keyring-api';
import { SnapId } from '@metamask/snaps-sdk';
import {
  getSelectedAccountTokensAcrossChains,
  getCrossChainMetaMaskCachedBalances,
  getMetaMaskHdKeyrings,
} from '..';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getMultichainAggregatedBalance } from '../assets';
import { isMultichainWalletSnap } from '../../../shared/lib/accounts/snaps';
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
  (_state, account) => account,
  getSelectedAccountTokensAcrossChains,
  getCrossChainMetaMaskCachedBalances,
  (state, account) => getMultichainAggregatedBalance(state, account),
  (state, account) => isPrimaryHdOrFirstPartySnapAccount(state, account),
  (
    state,
    account,
    tokens: TokensByChainId,
    crossChainBalances: AccountsByChainId,
    aggregatedBalance,
    isAccountAPrimaryHdOrFirstPartySnapAccount,
  ) => {
    const { seedPhraseBackedUp, dismissSeedBackUpReminder } = state.metamask;

    // If there is no account, we don't need to show the seed phrase reminder
    // or if the account is not a primary HD or first party snap account
    // It is assumed that imported srp accounts are backed up
    if (!account || !isAccountAPrimaryHdOrFirstPartySnapAccount) {
      return false;
    }

    let hasBalance = false;

    if (isEvmAccountType(account.type)) {
      hasBalance =
        Object.values(tokens).some((chains) => {
          return (
            chains?.[account.address as keyof typeof chains]?.balance &&
            Number(chains?.[account.address as keyof typeof chains]?.balance) >
              0
          );
        }) ||
        Object.values(crossChainBalances).some((chain) => {
          return (
            chain?.[account.address as keyof typeof chain]?.balance &&
            Number(chain?.[account.address as keyof typeof chain]?.balance) > 0
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
