import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  CaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
  Hex,
  hexToBigInt,
} from '@metamask/utils';
import { shallowEqual, useSelector } from 'react-redux';
import {
  CurrencyRateState,
  TokensControllerState,
} from '@metamask/assets-controllers';
import { isEvmAccountType } from '@metamask/keyring-api';
import { Caip2ChainId } from '@metamask/snaps-utils';
import {
  getAllTokens,
  getChainIdsToPoll,
  getCrossChainMetaMaskCachedBalances,
  getCrossChainTokenExchangeRates,
  getCurrencyRates,
} from '../../selectors';
import { useTokenBalances } from '../useTokenBalances';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { getTokenFiatAmount } from '../../helpers/utils/token-util';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../shared/constants/network';
import { getValueFromWeiHex } from '../../../shared/modules/conversion.utils';
import {
  getMultichainBalances,
  getMultichainCoinRates,
  getMultichainNetworkProviders,
} from '../../selectors/multichain';
import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from '../../../shared/constants/multichain/assets';

export type AssetWithBalance = {
  iconUrl: string;
  symbol: string;
  fiat?: string;
  chainId: Caip2ChainId;
  balance: number;
  string: string;
};

export const useMultichainAccountBalances = (
  account: InternalAccount,
  chainIds?: CaipChainId[],
) => {
  const importedTokens: TokensControllerState['allTokens'] =
    useSelector(getAllTokens);

  const allChainIDs = useSelector(getChainIdsToPoll);
  const allNetworkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const currencyRates: CurrencyRateState['currencyRates'] =
    useSelector(getCurrencyRates);
  const currentCurrency: CurrencyRateState['currentCurrency'] =
    useSelector(getCurrentCurrency);
  const crossChainContractRates: Record<
    string,
    Record<string, number>
  > = useSelector(getCrossChainTokenExchangeRates, shallowEqual);
  const crossChainCachedBalances: Record<
    string,
    Record<string, number>
  > = useSelector(getCrossChainMetaMaskCachedBalances);

  const emvChainIds =
    chainIds?.reduce((acc, chainId) => {
      const { namespace, reference } = parseCaipChainId(chainId);
      if (namespace === KnownCaipNamespace.Eip155) {
        acc.push(parseInt(reference, 16).toString() as Hex);
      }

      return acc;
    }, [] as Hex[]) ?? (allChainIDs as Hex[]);

  const { tokenBalances: allTokenBalances } = useTokenBalances({
    chainIds: emvChainIds,
  });

  const multichainNetworks = useSelector(getMultichainNetworkProviders);

  const multichainConversionRates = useSelector(getMultichainCoinRates);

  const balances = useSelector(getMultichainBalances);

  if (isEvmAccountType(account.type)) {
    const tokenBalances = emvChainIds.reduce((allBalances, chainId) => {
      const tokens = importedTokens?.[chainId]?.[account.address] ?? [];

      // Get token balances
      const tokensWithBalances = tokens?.reduce((networkBalances, token) => {
        const hexBalance =
          allTokenBalances[account.address as Hex]?.[chainId as Hex]?.[
            token.address as Hex
          ] ?? '0x0';

        const decimalBalance = parseInt(hexBalance, 16);

        const { nativeCurrency } = allNetworkConfigurations[chainId];
        const { conversionRate } = currencyRates[nativeCurrency];

        const tokenExchangeRate =
          crossChainContractRates[chainId]?.[account.address];

        // Get the fiat value of the token
        const fiatValue = getTokenFiatAmount(
          tokenExchangeRate,
          conversionRate ?? 0,
          currentCurrency,
          decimalBalance.toString(),
          token.symbol,
          false,
          false,
        );

        networkBalances.push({
          iconUrl: token.image ?? '',
          symbol: token.symbol,
          balance: decimalBalance,
          chainId: `eip155:${hexToBigInt(chainId).toString(10)}`,
          string: decimalBalance.toString(),
          fiat: fiatValue,
        });

        return networkBalances;
      }, [] as AssetWithBalance[]);

      return [...allBalances, ...tokensWithBalances];
    }, [] as AssetWithBalance[]);

    const nativeBalances: AssetWithBalance[] = emvChainIds.map((chainId) => {
      const { nativeCurrency } = allNetworkConfigurations[chainId];
      const { conversionRate } = currencyRates[nativeCurrency];

      const balance = crossChainCachedBalances[chainId]?.[account.address] ?? 0;
      const fiatValue = getValueFromWeiHex({
        value: balance,
        toCurrency: currentCurrency,
        conversionRate: conversionRate ?? undefined,
        numberOfDecimals: 2,
      });
      return {
        iconUrl:
          CHAIN_ID_TOKEN_IMAGE_MAP[
            chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
          ] ?? '',
        symbol:
          CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
            chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
          ],
        balance,
        chainId: `eip155:${hexToBigInt(chainId).toString(10)}`,
        fiat: fiatValue,
        string: balance.toString(),
      };
    });

    const assetsWithBalance = [...tokenBalances, ...nativeBalances];

    const sortedAssets = assetsWithBalance.sort(
      (a, b) => parseFloat(a.fiat ?? '0') - parseFloat(b.fiat ?? '0'),
    );

    const totalFiatBalance = assetsWithBalance.reduce((acc, { fiat }) => {
      if (fiat) {
        return acc + parseFloat(fiat);
      }
      return acc;
    }, 0);

    return {
      totalFiatBalance: totalFiatBalance.toString(),
      assets: sortedAssets,
    };
  }

  const compatibleNetworks = multichainNetworks.filter((network) =>
    network.isAddressCompatible(account.address),
  );

  const filteredCompatibleNetworks = chainIds
    ? compatibleNetworks.filter((network) => chainIds.includes(network.chainId))
    : compatibleNetworks;

  console.log('filteredCompatibleNetworks', filteredCompatibleNetworks);
  const accountBalances = filteredCompatibleNetworks.reduce((acc, network) => {
    const { ticker } = network;
    const conversionRate =
      multichainConversionRates?.[ticker]?.conversionRate ?? '0';

    const asset =
      MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19[
        ticker as keyof typeof MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19
      ];

    const balance = balances?.[account.id]?.[asset]?.amount;

    const fiatBalance = getTokenFiatAmount(
      1, // coin to native conversion rate is 1:1
      Number(conversionRate), // native to fiat conversion rate
      currentCurrency,
      balance,
      ticker,
      false,
      false,
    );

    if (!balance) {
      return acc;
    }

    const assetWithBalance = {
      iconUrl: network.rpcPrefs?.imageUrl ?? '',
      symbol: ticker,
      chainId: network.chainId,
      fiat: fiatBalance ?? '0',
      balance: parseFloat(balance),
      string: balance,
    };

    return [...acc, assetWithBalance];
  }, [] as AssetWithBalance[]);

  const sortedAssets = accountBalances.sort(
    (a, b) => parseFloat(a.fiat ?? '0') - parseFloat(b.fiat ?? '0'),
  );

  const totalFiatBalance = accountBalances.reduce((acc, { fiat }) => {
    if (fiat) {
      return acc + parseFloat(fiat);
    }
    return acc;
  }, 0);

  return {
    totalFiatBalance: totalFiatBalance.toString(),
    assets: sortedAssets,
  };
};
