import {
  formatChainIdToCaip,
  getNativeAssetForChainId,
  formatChainIdToHex,
} from '@metamask/bridge-controller';
import { BtcScope, SolScope, TrxScope, EthScope } from '@metamask/keyring-api';
import { createSelector } from 'reselect';
import { BigNumber } from 'bignumber.js';
import {
  CaipAssetType,
  CaipChainId,
  getChecksumAddress,
  isStrictHexString,
  parseCaipAssetType,
  type Hex,
} from '@metamask/utils';
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getMultichainBalances } from '../../selectors/multichain';
import {
  getAccountAssets,
  getAssetsMetadata,
  getAssetsRates,
} from '../../selectors/assets';
import { getInternalAccountByGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import { AccountGroupId } from '@metamask/account-api';
import { AccountId } from '@metamask/keyring-utils';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { BridgeAppState } from './selectors';

const getEvmAssetsWithBalance = createSelector(
  [
    (state: BridgeAppState) => state.metamask.tokensChainsCache,
    (state: BridgeAppState, accountAddress: Hex) => {
      return Object.fromEntries(
        Object.entries(
          state.metamask.tokenBalances[accountAddress.toLowerCase() as Hex],
        )
          .filter(([chainId]) =>
            ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId as Hex),
          )
          .flatMap(([chainId, balanceByAddress]) => {
            return Object.entries(balanceByAddress).map(
              ([address, balance]) => {
                return [
                  toAssetId(
                    address as Hex,
                    formatChainIdToCaip(chainId),
                  ).toLowerCase(),
                  balance,
                ];
              },
            );
          }),
      );
    },
  ],
  (tokensByChainIdByAddress, hexTokenBalancesByAssetId) => {
    const evmAssetsWithBalance: {
      symbol: string;
      assetId: CaipAssetType;
      decimals: number;
      name: string;
      chainId: CaipChainId;
      balance: string;
    }[] = [];
    Object.entries(hexTokenBalancesByAssetId).forEach(
      ([assetId, hexBalance]) => {
        const { chainId, assetReference } = parseCaipAssetType(
          assetId as CaipAssetType,
        );
        const token =
          tokensByChainIdByAddress[formatChainIdToHex(chainId)].data[
            assetReference.toLowerCase()
          ] ??
          tokensByChainIdByAddress[formatChainIdToHex(chainId)].data[
            isStrictHexString(assetReference)
              ? getChecksumAddress(assetReference)
              : assetReference
          ] ??
          getNativeAssetForChainId(chainId);
        const balance = new BigNumber(hexBalance, 16);
        if (token && !balance.isZero()) {
          const { symbol, decimals, name } = token;

          const balanceInDecString = balance
            .div(new BigNumber(10).pow(decimals))
            .toString(10);

          evmAssetsWithBalance.push({
            symbol,
            assetId: assetId as CaipAssetType,
            decimals,
            name,
            chainId,
            balance: balanceInDecString,
          });
        }
      },
    );
    return evmAssetsWithBalance;
  },
);

const getNonEvmAssetsWithBalance = createSelector(
  [
    (state: BridgeAppState, accountIds: AccountId[]) =>
      accountIds.flatMap((id) => getAccountAssets(state)[id]),
    (state: BridgeAppState, accountIds: AccountId[]) =>
      accountIds
        .map((id) => getMultichainBalances(state)[id])
        .filter(Boolean)
        .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    getAssetsMetadata,
  ],
  (accountAssetIds, balancesByAssetId, assetsMetadataByAssetId) => {
    const assetsWithBalances: {
      chainId: CaipChainId;
      symbol: string;
      assetId: CaipAssetType;
      balance: string;
      decimals: number;
      name: string;
    }[] = [];
    accountAssetIds.forEach((assetId) => {
      const assetMetadata = assetsMetadataByAssetId[assetId];
      const balance = balancesByAssetId[assetId]?.amount ?? '0';
      if (assetMetadata && new BigNumber(balance).gt(0)) {
        const { units, symbol } = assetMetadata;
        const { chainId } = parseCaipAssetType(assetId);
        assetsWithBalances.push({
          chainId,
          symbol: symbol ?? '',
          assetId,
          balance,
          decimals: units[0]?.decimals,
          name: assetMetadata.name ?? assetMetadata.symbol ?? '',
        });
      }
    });
    return assetsWithBalances;
  },
);

const getNonEvmAccountIds = (
  state: BridgeAppState,
  accountGroupId: AccountGroupId,
) =>
  [BtcScope.Mainnet, SolScope.Mainnet, TrxScope.Mainnet]
    .map(
      (scope) =>
        getInternalAccountByGroupAndCaip(state, accountGroupId, scope)?.id,
    )
    .filter((id) => id !== undefined);

const getExchangeRatesByAssetId = (
  state: BridgeAppState,
): Record<CaipAssetType, number> => {
  const { marketData, currencyRates } = state.metamask;
  const exchangeRatesByAssetId = Object.entries(marketData)
    .filter(([chainId, _]) =>
      ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId as Hex),
    )
    .flatMap(([chainId, assetsToMarketData]) => {
      const nativeToCurrencyRate =
        currencyRates[getNativeAssetForChainId(chainId)?.symbol]
          ?.conversionRate ?? 0;
      return Object.entries(assetsToMarketData).map(([address, { price }]) => [
        toAssetId(address.toLowerCase(), formatChainIdToCaip(chainId)),
        nativeToCurrencyRate * price,
      ]);
    });
  return Object.fromEntries(exchangeRatesByAssetId);
};

const getBridgeAssetsForAccountGroupId = createDeepEqualSelector(
  [
    (state: BridgeAppState, accountGroupId: AccountGroupId) => {
      const accountAddress = getInternalAccountByGroupAndCaip(
        state,
        accountGroupId,
        EthScope.Mainnet,
      )?.address;
      if (!accountAddress || !isStrictHexString(accountAddress)) {
        return [];
      }
      return getEvmAssetsWithBalance(state, accountAddress);
    },
    getExchangeRatesByAssetId,
    (state: BridgeAppState, accountGroupId: AccountGroupId) => {
      const accountIds = getNonEvmAccountIds(state, accountGroupId);
      return getNonEvmAssetsWithBalance(state, accountIds);
    },
    getAssetsRates,
  ],
  (
    evmAssetsWithBalance,
    evmExchangeRatesByAssetId,
    nonEvmAssetsWithBalance,
    nonEvmExchangeRatesByAssetId,
  ) => {
    const evmAssetsWithFiatBalances = evmAssetsWithBalance.map((asset) => ({
      ...asset,
      tokenFiatAmount:
        evmExchangeRatesByAssetId[asset.assetId] * Number(asset.balance),
    }));
    const nonEvmAssetsWithFiatBalances = nonEvmAssetsWithBalance.map(
      (asset) => ({
        ...asset,
        tokenFiatAmount: new BigNumber(asset.balance)
          .times(nonEvmExchangeRatesByAssetId[asset.assetId]?.rate ?? 0)
          .toNumber(),
      }),
    );

    return [...nonEvmAssetsWithFiatBalances, ...evmAssetsWithFiatBalances].sort(
      (a, b) => (b?.tokenFiatAmount ?? 0) - (a?.tokenFiatAmount ?? 0),
    );
  },
);

export const getBridgeAssetsWithBalance = createSelector(
  [
    (state: BridgeAppState, accountGroupId: AccountGroupId) =>
      getBridgeAssetsForAccountGroupId(state, accountGroupId),
  ],
  (assetsWithFiatBalances) => {
    // TODO accountType
    return {
      balanceByAssetId: Object.fromEntries(
        assetsWithFiatBalances.map((asset) => [asset.assetId, asset]),
      ),
      assetsWithBalance: assetsWithFiatBalances,
    };
  },
);
