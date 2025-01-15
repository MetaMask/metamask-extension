import { createSelector } from 'reselect';
import { isEvmAccountType } from '@metamask/keyring-api';
import { SubjectType } from '@metamask/permission-controller';
import { memoize } from 'lodash';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { getInternalAccounts, getSelectedInternalAccount } from './accounts';
import { getMultichainBalances } from './getMultichainBalances';
import { getMultichainNetworkProviders } from './getMultichainNetworkProviders';

/**
 * Get MetaMask accounts, including account name and balance.
 */
export const getMetaMaskAccounts = createSelector(
  getInternalAccounts,
  getMetaMaskAccountBalances,
  getMetaMaskCachedBalances,
  getMultichainBalances,
  getMultichainNetworkProviders,
  (
    internalAccounts,
    balances,
    cachedBalances,
    multichainBalances,
    multichainNetworkProviders,
  ) =>
    Object.values(internalAccounts).reduce((accounts, internalAccount) => {
      // TODO: mix in the identity state here as well, consolidating this
      // selector with `accountsWithSendEtherInfoSelector`
      let account = internalAccount;

      // TODO: `AccountTracker` balances are in hex and `MultichainBalance` are in number.
      // We should consolidate the format to either hex or number
      if (isEvmAccountType(internalAccount.type)) {
        if (balances?.[internalAccount.address]) {
          account = {
            ...account,
            ...balances[internalAccount.address],
          };
        }
      } else {
        const multichainNetwork = multichainNetworkProviders.find((network) =>
          network.isAddressCompatible(internalAccount.address),
        );
        account = {
          ...account,
          balance:
            multichainBalances?.[internalAccount.id]?.[
              MULTICHAIN_NETWORK_TO_ASSET_TYPES[multichainNetwork.chainId]
            ]?.amount ?? '0',
        };
      }

      if (account.balance === null || account.balance === undefined) {
        account = {
          ...account,
          balance:
            (cachedBalances && cachedBalances[internalAccount.address]) ??
            '0x0',
        };
      }

      return {
        ...accounts,
        [internalAccount.address]: account,
      };
    }, {}),
);
/**
 * Get account balances state.
 *
 * @param {object} state - Redux state
 * @returns {object} A map of account addresses to account objects (which includes the account balance)
 */

export function getMetaMaskAccountBalances(state) {
  return state.metamask.accounts;
}
export function getMetaMaskCachedBalances(state) {
  const chainId = getCurrentChainId(state);

  if (state.metamask.accountsByChainId?.[chainId]) {
    return Object.entries(state.metamask.accountsByChainId[chainId]).reduce(
      (accumulator, [key, value]) => {
        accumulator[key] = value.balance;
        return accumulator;
      },
      {},
    );
  }
  return {};
}

export const getSelectedAccount = createDeepEqualSelector(
  getMetaMaskAccounts,
  getSelectedInternalAccount,
  (accounts, selectedAccount) => {
    // At the time of onboarding there is no selected account
    if (selectedAccount) {
      return {
        ...selectedAccount,
        ...accounts[selectedAccount.address],
      };
    }
    return undefined;
  },
);
/**
 * Returns an array of internal accounts sorted by keyring.
 *
 * @param keyrings - The array of keyrings.
 * @param accounts - The object containing the accounts.
 * @returns The array of internal accounts sorted by keyring.
 */

export const getInternalAccountsSortedByKeyring = createSelector(
  getMetaMaskKeyrings,
  getMetaMaskAccounts,
  (keyrings, accounts) => {
    // keep existing keyring order
    const internalAccounts = keyrings
      .map(({ accounts: addresses }) => addresses)
      .flat()
      .map((address) => {
        return accounts[address];
      });

    return internalAccounts;
  },
);

export function getInternalAccount(state, accountId) {
  return state.metamask.internalAccounts.accounts[accountId];
}
export function getOriginOfCurrentTab(state) {
  return state.activeTab.origin;
}

/**
 * @param {string} svgString - The raw SVG string to make embeddable.
 * @returns {string} The embeddable SVG string.
 */

export const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);

export function getTargetSubjectMetadata(state, origin) {
  const metadata = getSubjectMetadata(state)[origin];

  if (metadata?.subjectType === SubjectType.Snap) {
    const { svgIcon, ...remainingMetadata } = metadata;
    return {
      ...remainingMetadata,
      iconUrl: svgIcon ? getEmbeddableSvg(svgIcon) : null,
    };
  }

  return metadata;
}

export function getSubjectMetadata(state) {
  return state.metamask.subjectMetadata;
}

export function getMetaMaskKeyrings(state) {
  return state.metamask.keyrings;
}
