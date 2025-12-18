import {
  formatChainIdToCaip,
  formatChainIdToHex,
  getNativeAssetForChainId,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { type AccountGroupId } from '@metamask/account-api';
import { createSelector as untypedCreateSelector } from 'reselect';
import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';
import {
  type CaipAssetType,
  type CaipChainId,
  getChecksumAddress,
  isCaipAssetType,
  isStrictHexString,
  parseCaipAssetType,
} from '@metamask/utils';
import { ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { getMultichainBalances } from '../../selectors/multichain';
import {
  getAccountAssets,
  getAssetsMetadata,
  getAssetsRates,
} from '../../selectors/assets';
import { getInternalAccountByGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import { type BridgeAppState, getFromChains } from './selectors';
import { type BridgeToken } from './types';
import { isTronEnergyOrBandwidthResource } from './utils';

const createSelector = untypedCreateSelector.withTypes<BridgeAppState>();

const convertHexBalanceToDecimal = (hex: string, decimals: number): string =>
  isStrictHexString(hex)
    ? new BigNumber(hex, 16).div(new BigNumber(10).pow(decimals)).toString(10)
    : '0';

const getNonEvmAccountIds = (
  state: BridgeAppState,
  id: AccountGroupId,
): string[] =>
  ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS.map(
    (scope) => getInternalAccountByGroupAndCaip(state, id, scope)?.id,
  ).filter((matchedId) => matchedId !== undefined);

const getEvmAccountAddress = (state: BridgeAppState, id: AccountGroupId) =>
  getInternalAccountByGroupAndCaip(state, id, 'eip155:1')?.address;

const getAllowedHexChainIds = createSelector([getFromChains], (fromChains) =>
  fromChains
    .map(({ chainId }) =>
      isNonEvmChainId(chainId) ? undefined : formatChainIdToHex(chainId),
    )
    .filter((chainId) => chainId !== undefined),
);

const getERC20AssetsWithBalance = createSelector(
  [
    getEvmAccountAddress,
    getAllowedHexChainIds,
    ({ metamask: { tokenBalances } }) => tokenBalances,
    ({ metamask: { tokensChainsCache } }) => tokensChainsCache,
  ],
  (
    accountAddress,
    hexChainIds,
    balancesByAccountAddress,
    tokensByChainIdByAddress,
  ) => {
    const assetsWithBalance: BridgeToken[] = [];
    if (!accountAddress || !isStrictHexString(accountAddress)) {
      return assetsWithBalance;
    }
    const normalizedAddress = getChecksumAddress(accountAddress);
    const lowercasedAddress = accountAddress.toLowerCase();

    const tokenBalances =
      balancesByAccountAddress[normalizedAddress] ??
      // @ts-expect-error - lowercasedAddress is a Hex string
      balancesByAccountAddress[lowercasedAddress];
    if (!tokenBalances) {
      return assetsWithBalance;
    }

    Object.entries(tokenBalances).forEach(([chainId, balanceByAddress]) => {
      if (!isStrictHexString(chainId) || !hexChainIds.includes(chainId)) {
        return;
      }
      const caipChainId = formatChainIdToCaip(chainId);
      Object.entries(balanceByAddress).forEach(([address, balance]) => {
        const tokenDataByAddress = tokensByChainIdByAddress[chainId]?.data;
        if (!tokenDataByAddress) {
          return;
        }
        const lowercasedTokenAddress = address.toLowerCase();
        const token =
          tokenDataByAddress[address] ??
          tokenDataByAddress[lowercasedTokenAddress] ??
          (isStrictHexString(address)
            ? tokenDataByAddress[getChecksumAddress(address)]
            : undefined);
        const assetId = toAssetId(lowercasedTokenAddress, caipChainId);
        if (token && assetId) {
          const { decimals, symbol, name } = token;
          assetsWithBalance.push({
            balance: convertHexBalanceToDecimal(balance, decimals),
            chainId: caipChainId,
            assetId,
            symbol,
            name,
            decimals,
          });
        }
      });
    });

    return assetsWithBalance;
  },
);

const getNativeAssetsWithBalance = createSelector(
  [
    getEvmAccountAddress,
    getAllowedHexChainIds,
    ({ metamask }) => metamask.accountsByChainId,
  ],
  (accountAddress, hexChainIds, balanceByChainIdByAccountAddress) => {
    const assetsWithBalance: BridgeToken[] = [];
    if (!accountAddress || !isStrictHexString(accountAddress)) {
      return assetsWithBalance;
    }
    const normalizedAddress = getChecksumAddress(accountAddress);
    const lowercasedAddress = accountAddress.toLowerCase();

    Object.entries(balanceByChainIdByAccountAddress).forEach(
      ([chainId, accounts]) => {
        if (!isStrictHexString(chainId) || !hexChainIds.includes(chainId)) {
          return;
        }

        const token = getNativeAssetForChainId(chainId);
        const account =
          accounts[normalizedAddress] ?? accounts[lowercasedAddress];

        if (account?.balance && token) {
          const { decimals, symbol, name, assetId } = token;
          assetsWithBalance.push({
            balance: convertHexBalanceToDecimal(account.balance, decimals),
            chainId: formatChainIdToCaip(chainId),
            symbol,
            name,
            decimals,
            assetId,
          });
        }
      },
    );
    return assetsWithBalance;
  },
);

// Combines native and ERC20 assets that have a balance
const getEvmAssetsWithBalance = createSelector(
  [getERC20AssetsWithBalance, getNativeAssetsWithBalance],
  (...assetsWithBalance) => assetsWithBalance.flat(),
);

// Calculates the exchange rate for each asset with a balance
const getEvmExchangeRates = createSelector(
  [
    ({ metamask }) => metamask.marketData,
    ({ metamask }) => metamask.currencyRates,
    getERC20AssetsWithBalance,
    getNativeAssetsWithBalance,
  ],
  (
    marketData,
    currencyRates,
    erc20AssetsWithBalance,
    nativeAssetsWithBalance,
  ) => {
    const exchangeRatesByAssetId: Record<CaipAssetType, number> = {};

    // Native exchange rates
    nativeAssetsWithBalance.forEach(({ symbol, assetId, chainId }) => {
      exchangeRatesByAssetId[assetId] = new BigNumber(
        currencyRates[symbol]?.conversionRate?.toString() ?? '0',
      )
        // Sometimes marketData has a price for zero address (native) so it needs to be factored in
        .times(
          // @ts-expect-error - hexChainId is a Hex string
          marketData[formatChainIdToHex(chainId)]?.[
            zeroAddress()
          ]?.price?.toString() ?? '1',
        )
        .toNumber();
    });

    // ERC20 exchange rates
    erc20AssetsWithBalance.forEach(({ assetId }) => {
      const { chainId, assetReference: address } = parseCaipAssetType(assetId);
      if (!isStrictHexString(address)) {
        return;
      }
      const { assetId: nativeAssetId } = getNativeAssetForChainId(chainId);

      const nativeToCurrencyRate = exchangeRatesByAssetId[nativeAssetId] ?? 0;
      const hexChainId = formatChainIdToHex(chainId);
      if (!marketData[hexChainId]) {
        return;
      }
      const lowercaseAddress = address.toLowerCase() as `0x${string}`;
      const checksumAddress = getChecksumAddress(address);
      const price = (
        marketData[hexChainId][lowercaseAddress] ??
        marketData[hexChainId][checksumAddress]
      )?.price;
      if (!price) {
        return;
      }
      exchangeRatesByAssetId[assetId] = new BigNumber(
        nativeToCurrencyRate.toString(),
      )
        .times(price.toString())
        .toNumber();
    });

    return exchangeRatesByAssetId;
  },
);

// Creates a map of asset IDs to balances for all non-EVM accounts
const getNonEvmBalances = createSelector(
  [getNonEvmAccountIds, getAccountAssets, getMultichainBalances],
  (accountIds, assetIdsByAccountId, balanceByAccountIdByAssetId) =>
    accountIds.reduce(
      (acc1, accountId) => ({
        ...acc1,
        ...(assetIdsByAccountId[accountId]?.reduce(
          (acc2, assetId) => ({
            ...acc2,
            [assetId]:
              balanceByAccountIdByAssetId[accountId]?.[assetId]?.amount ?? '0',
          }),
          {} as Record<CaipAssetType, string>,
        ) ?? {}),
      }),
      {} as Record<CaipAssetType, string>,
    ),
);

// Creates a map of asset IDs to token data for all non-EVM accounts with a balance
const getNonEvmAssetsWithBalance = createSelector(
  [getNonEvmBalances, getAssetsMetadata],
  (balancesByAssetId, assetsMetadataByAssetId) =>
    Object.entries(balancesByAssetId)
      .map(([assetId, balance]) => {
        if (!isCaipAssetType(assetId)) {
          return undefined;
        }
        const assetMetadata = assetsMetadataByAssetId[assetId];
        if (!assetMetadata) {
          return undefined;
        }

        const { units, symbol } = assetMetadata;
        const { chainId } = parseCaipAssetType(assetId);

        return {
          chainId,
          symbol: symbol ?? '',
          assetId,
          balance,
          decimals: units[0]?.decimals,
          name: assetMetadata.name ?? assetMetadata.symbol ?? '',
        };
      })
      .filter((a) => a !== undefined),
);

// Combines EVM and non-EVM assets and appends tokenFiatAmount to each asset
const getBridgeAssetsForAccountGroupId = createSelector(
  [
    getEvmAssetsWithBalance,
    getEvmExchangeRates,
    getNonEvmAssetsWithBalance,
    getAssetsRates,
  ],
  (
    evmAssetsWithBalance,
    evmExchangeRatesByAssetId,
    nonEvmAssetsWithBalance,
    nonEvmExchangeRatesByAssetId,
  ): BridgeToken[] => {
    const evmAssetsWithFiatBalances = evmAssetsWithBalance.map((asset) => ({
      ...asset,
      tokenFiatAmount: new BigNumber(asset.balance ?? '0')
        .times(evmExchangeRatesByAssetId[asset.assetId]?.toString() ?? '0')
        .toNumber(),
    }));

    const nonEvmAssetsWithFiatBalances = nonEvmAssetsWithBalance
      // Filter out Tron Energy and Bandwidth resources
      .filter(
        ({ chainId, symbol }: BridgeToken) =>
          !isTronEnergyOrBandwidthResource(chainId, symbol),
      )
      .map((asset) => ({
        ...asset,
        tokenFiatAmount: new BigNumber(asset.balance ?? '0')
          .times(
            nonEvmExchangeRatesByAssetId[asset.assetId]?.rate?.toString() ??
              '0',
          )
          .toNumber(),
      }));

    return nonEvmAssetsWithFiatBalances.concat(evmAssetsWithFiatBalances);
  },
);

/**
 * Get all assets owned by the wallet's accounts sorted by fiat balance
 *
 * @param state - The state of the bridge app.
 * @param accountGroupId - The ID of the account group to get the assets for.
 * @returns The sorted assets for the given account group and selected asset.
 */
export const getBridgeSortedAssets = createSelector(
  [getBridgeAssetsForAccountGroupId],
  (assetsWithBalances) =>
    assetsWithBalances.sort(
      (a, b) => (b.tokenFiatAmount ?? 0) - (a.tokenFiatAmount ?? 0),
    ),
);

/**
 * Get all assets owned by the wallet's accounts by asset ID
 *
 * @param state - The state of the bridge app.
 * @param accountGroupId - The ID of the account group to get the assets for.
 * @returns The assets owned by the wallet's accounts by asset ID.
 */
export const getBridgeAssetsByAssetId = createSelector(
  [getBridgeAssetsForAccountGroupId],
  (assetsWithBalance) =>
    assetsWithBalance.reduce(
      (acc, asset) => {
        acc[asset.assetId] = asset;
        return acc;
      },
      {} as Record<CaipAssetType, BridgeToken>,
    ),
);

/**
 * Get the total fiat balance of all assets owned by the wallet's accounts by chain ID
 *
 * @param state - The state of the bridge app.
 * @param accountGroupId - The ID of the account group to get the assets for.
 * @returns The assets owned by the wallet's accounts by chain ID.
 */
export const getBridgeBalancesByChainId = createSelector(
  [getBridgeAssetsForAccountGroupId],
  (assetsWithBalance) =>
    assetsWithBalance.reduce(
      (acc, asset) => {
        if (!acc[asset.chainId]) {
          acc[asset.chainId] = 0;
        }
        acc[asset.chainId] += asset.tokenFiatAmount ?? 0;
        return acc;
      },
      {} as Record<CaipChainId, number>,
    ),
);
