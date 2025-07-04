import { isEvmAccountType } from '@metamask/keyring-api';
import { SnapId } from '@metamask/snaps-sdk';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringObject } from '@metamask/keyring-controller';
import {
  getSelectedAccountTokensAcrossChains,
  getCrossChainMetaMaskCachedBalances,
  getMetaMaskHdKeyrings,
  getInternalAccounts,
} from '..';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getMultichainAggregatedBalance } from '../assets';
import { isMultichainWalletSnap } from '../../../shared/lib/accounts/snaps';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';

type AccountsByChainId = {
  [chainId: string]: {
    [address: string]: string;
  };
};

type TokensByChainId = {
  [chainId: string]: {
    balance: string;
  }[];
};

const isPrimaryHdAndFirstPartySnapAccount = createDeepEqualSelector(
  (_state, account) => account,
  getMetaMaskHdKeyrings,
  (account, hdKeyrings: KeyringObject[]) => {
    const [primaryKeyring] = hdKeyrings;

    // There are no keyrings during onboarding.
    if (!primaryKeyring) {
      return false;
    }

    if (
      primaryKeyring.accounts.find((address: string) =>
        isEqualCaseInsensitive(account.address, address),
      )
    ) {
      return true;
    }

    if (
      account.metadata.snap &&
      isMultichainWalletSnap(account.metadata.snap.id as SnapId) &&
      account.options?.entropySource === primaryKeyring.metadata.id
    ) {
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
  (state, account) => isPrimaryHdAndFirstPartySnapAccount(state, account),
  (
    state,
    account: InternalAccount,
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
          return chains.some(
            (chain) => chain.balance && parseInt(chain.balance, 16) > 0,
          );
        }) ||
        Object.values(crossChainBalances).some((chain) => {
          return (
            chain?.[account.address as keyof typeof chain] &&
            parseInt(chain?.[account.address as keyof typeof chain], 16) > 0
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

export const getSnapAccountsByKeyringId = createDeepEqualSelector(
  getInternalAccounts,
  (_state, keyringId) => keyringId,
  (accounts, keyringId) => {
    return accounts.filter(
      (account: InternalAccount) =>
        account.metadata.snap &&
        isSnapPreinstalled(account.metadata.snap.id as SnapId) &&
        account.options?.entropySource === keyringId,
    );
  },
);
