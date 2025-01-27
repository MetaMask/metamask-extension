import PropTypes from 'prop-types';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { createSelector } from 'reselect';
import { Numeric } from '../../shared/modules/Numeric';
import {
  MultichainProviderConfig,
  MultichainNetworks,
  MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET,
} from '../../shared/constants/multichain/networks';
import {
  getConversionRate,
  getNativeCurrency,
  getCurrentCurrency,
} from '../ducks/metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_NETWORK_IDS,
  CHAIN_IDS,
} from '../../shared/constants/network';
import { getProviderConfig } from '../../shared/modules/selectors/networks';
import { getSelectedInternalAccount } from './accounts';
import {
  getIsMainnet,
  getNativeCurrencyImage,
  getShouldShowFiat,
  getShowFiatInTestnets,
} from './selectors';
import { getMultichainSelectedAccountCachedBalance } from './multichain-selected-account-cached-balance';
import { getMultichainIsEvm } from './multichain-isevm';
import type { MultichainState } from './multichain.types';
import { getMultichainProviderConfig } from './multichain-provider-config';

export const MultichainNetworkPropType = PropTypes.shape({
  nickname: PropTypes.string.isRequired,
  isEvmNetwork: PropTypes.bool.isRequired,
  chainId: PropTypes.string,
  network: PropTypes.oneOfType([
    PropTypes.shape({
      rpcUrl: PropTypes.string,
      type: PropTypes.string.isRequired,
      chainId: PropTypes.string.isRequired,
      ticker: PropTypes.string.isRequired,
      rpcPrefs: PropTypes.shape({
        blockExplorerUrl: PropTypes.string,
        imageUrl: PropTypes.string,
      }),
      nickname: PropTypes.string,
      id: PropTypes.string,
    }),
    PropTypes.shape({
      chainId: PropTypes.string.isRequired,
      ticker: PropTypes.string.isRequired,
      rpcPrefs: PropTypes.shape({
        blockExplorerUrl: PropTypes.string,
        imageUrl: PropTypes.string,
      }),
    }),
  ]).isRequired,
});

export const InternalAccountPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  metadata: PropTypes.shape({
    name: PropTypes.string.isRequired,
    snap: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      enabled: PropTypes.bool,
    }),
    keyring: PropTypes.shape({
      type: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  type: PropTypes.string.isRequired,
});

export function getMultichainIsBitcoin(
  state: MultichainState,
  account?: InternalAccount,
) {
  const isEvm = getMultichainIsEvm(state, account);
  const { symbol } = getMultichainDefaultToken(state, account);

  return !isEvm && symbol === 'BTC';
}

export function getMultichainNativeCurrency(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainIsEvm(state, account)
    ? getNativeCurrency(state)
    : getMultichainProviderConfig(state, account).ticker;
}

export function getMultichainCurrentCurrency(state: MultichainState) {
  return getCurrentCurrency(state);
}

export function getMultichainCurrencyImage(
  state: MultichainState,
  account?: InternalAccount,
) {
  if (getMultichainIsEvm(state, account)) {
    return getNativeCurrencyImage(state);
  }

  const provider = getMultichainProviderConfig(
    state,
    account,
  ) as MultichainProviderConfig;
  return provider.rpcPrefs?.imageUrl;
}

export function getMultichainNativeCurrencyImage(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainCurrencyImage(state, account);
}

export function getMultichainShouldShowFiat(
  state: MultichainState,
  account?: InternalAccount,
) {
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const isTestnet = getMultichainIsTestnet(state, selectedAccount);
  const isMainnet = !isTestnet;

  return getMultichainIsEvm(state, selectedAccount)
    ? getShouldShowFiat(state)
    : isMainnet || (isTestnet && getShowFiatInTestnets(state));
}

export function getMultichainDefaultToken(
  state: MultichainState,
  account?: InternalAccount,
) {
  const symbol = getMultichainIsEvm(state, account)
    ? // We fallback to 'ETH' to keep original behavior of `getSwapsDefaultToken`
      getProviderConfig(state)?.ticker ?? 'ETH'
    : getMultichainProviderConfig(state, account).ticker;

  return { symbol };
}

export function getMultichainCurrentChainId(state: MultichainState) {
  const { chainId } = getMultichainProviderConfig(state);
  return chainId;
}

export function isChainIdMainnet(chainId: string) {
  return chainId === CHAIN_IDS.MAINNET;
}

export function getMultichainIsMainnet(
  state: MultichainState,
  account?: InternalAccount,
) {
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const providerConfig = getMultichainProviderConfig(state, selectedAccount);

  if (getMultichainIsEvm(state, account)) {
    return getIsMainnet(state);
  }

  const mainnet = (
    MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET as Record<string, string>
  )[selectedAccount.type];
  return providerConfig.chainId === mainnet ?? false;
}

export function getMultichainIsTestnet(
  state: MultichainState,
  account?: InternalAccount,
) {
  // NOTE: Since there are 2 different implementations for `IsTestnet` and `IsMainnet` we follow
  // the same pattern here too!
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const providerConfig = getMultichainProviderConfig(state, selectedAccount);
  return getMultichainIsEvm(state, account)
    ? // FIXME: There are multiple ways of checking for an EVM test network, but
      // current implementation differ between each other. So we do not use
      // `getIsTestnet` here and uses the actual `TEST_NETWORK_IDS` which seems
      // more up-to-date
      (TEST_NETWORK_IDS as string[]).includes(providerConfig.chainId)
    : // TODO: For now we only check for bitcoin, but we will need to
      // update this for other non-EVM networks later!
      (providerConfig as MultichainProviderConfig).chainId ===
        MultichainNetworks.BITCOIN_TESTNET;
}

export const getMultichainCoinRates = (state: MultichainState) => {
  return state.metamask.rates;
};

export function getImageForChainId(chainId: string) {
  const evmChainIdKey =
    chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;

  return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[evmChainIdKey];
}

export const getMultichainSelectedAccountCachedBalanceIsZero = createSelector(
  [getMultichainIsEvm, getMultichainSelectedAccountCachedBalance],
  (isEvm, balance) => {
    const base = isEvm ? 16 : 10;
    const numericBalance = new Numeric(balance, base);
    return numericBalance.isZero();
  },
);

export function getMultichainConversionRate(
  state: MultichainState,
  account?: InternalAccount,
) {
  const { ticker } = getMultichainProviderConfig(state, account);

  return getMultichainIsEvm(state, account)
    ? getConversionRate(state)
    : getMultichainCoinRates(state)?.[ticker.toLowerCase()]?.conversionRate;
}
