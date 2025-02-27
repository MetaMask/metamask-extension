import {
  CaipAccountId,
  CaipAssetType,
  CaipChainId,
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
  toCaipAssetType,
  toCaipChainId,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getInternalAccountByAddress,
  getMemoizedCurrentCurrency,
  getMemoizedInternalAccountByAddress,
} from '../../../../selectors';
import {
  getMultiChainAssets,
  getTokenBalancesEvm,
} from '../../../../selectors/assets';
import { TokenWithFiatAmount } from '../../assets/types';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatWithThreshold } from '../../assets/util/formatWithThreshold';
import {
  getImageForChainId,
  getMemoizedMultichainNetworkConfigurationsByChainId,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../../selectors/multichain';
import {
  AllowedBridgeChainIds,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../shared/constants/bridge';
import {
  networkTitleOverrides,
  TranslateFunction,
} from '../../assets/util/networkTitleOverrides';
import { useI18nContext } from '../../../../hooks/useI18nContext';

/**
 * An asset for the SnapUIAssetSelector.
 */
export type SnapUIAsset = {
  icon: string;
  symbol: string;
  name: string;
  balance: string;
  fiat: string;
  chainId: CaipChainId;
  address: CaipAssetType;
  networkName: string;
  networkIcon?: string;
};

/**
 * A multichain asset. Derived from the EVM asset type.
 */
type MultichainAsset = Omit<TokenWithFiatAmount, 'chainId' | 'address'> & {
  chainId: CaipChainId;
  address: CaipAssetType;
};

/**
 * The parameters for the hook.
 *
 * @param addresses - The addresses to get the assets for.
 * This is a list of the same address but for different chains.
 * @param chainIds - The chainIds to filter the assets by.
 */
type UseSnapAssetSelectorDataParams = {
  addresses: CaipAccountId[];
  chainIds?: CaipChainId[];
};

/**
 * Gets the assets from state and format them for the SnapUIAssetSelector.
 *
 * @param params - The parameters for the hook.
 * @param params.addresses - The addresses to get the assets for.
 * This is a list of the same address but for different chains.
 * @param params.chainIds - The chainIds to filter the assets by.
 * @returns The formatted assets.
 */
export const useSnapAssetSelectorData = ({
  addresses,
  chainIds,
}: UseSnapAssetSelectorDataParams) => {
  const t = useI18nContext();
  const currentCurrency = useSelector(getMemoizedCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  const parsedAccounts = addresses.map(parseCaipAccountId);

  const account = useSelector((state) =>
    getMemoizedInternalAccountByAddress(state, parsedAccounts[0].address),
  );
  const networks = useSelector(
    getMemoizedMultichainNetworkConfigurationsByChainId,
  );

  const nonEvmAssets = useSelector((state) =>
    getMultiChainAssets(state, account),
  );

  const evmAssets = useSelector((state) =>
    getTokenBalancesEvm(state, account?.address),
  );

  /**
   * Formats a fiat balance.
   *
   * @param balance - The balance to format.
   * @returns The formatted balance.
   */
  const formatFiatBalance = (balance: number | null = 0) =>
    formatWithThreshold(balance, 0.01, locale, {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    });

  /**
   * Formats an EVM asset for the SnapUIAssetSelector.
   *
   * @param asset - The asset to format.
   * @returns The formatted asset.
   */
  const formatEvmAsset = (asset: TokenWithFiatAmount) => {
    const chainId = toCaipChainId('eip155', BigInt(asset.chainId).toString(10));

    const networkName =
      NETWORK_TO_SHORT_NETWORK_NAME_MAP[
        asset.chainId as AllowedBridgeChainIds
      ] ?? networks[asset.chainId]?.name;

    // Get the native asset name or the token name
    const assetName = asset.isNative
      ? networkTitleOverrides(t as TranslateFunction, { title: asset.symbol })
      : // @ts-expect-error wrong asset type
        asset.name;

    // Convert the EVM asset address to a CAIP asset type
    const assetNamepace = asset.isNative ? 'slip44' : 'erc20';
    const assetReference = asset.isNative ? '60' : asset.address;
    const address = toCaipAssetType(
      'eip155',
      BigInt(asset.chainId).toString(10),
      assetNamepace,
      assetReference,
    );

    return {
      icon: asset.image,
      symbol: asset.symbol,
      name: assetName,
      networkName,
      networkIcon: getImageForChainId(asset.chainId),
      balance: asset.balance ?? '0',
      fiat: formatFiatBalance(asset.tokenFiatAmount),
      chainId,
      address,
    };
  };

  /**
   * Formats a non-EVM asset for the SnapUIAssetSelector.
   *
   * @param asset - The asset to format.
   * @returns The formatted asset.
   */
  const formatNonEvmAsset = (asset: MultichainAsset) => {
    const networkName =
      NETWORK_TO_SHORT_NETWORK_NAME_MAP[
        asset.chainId as AllowedBridgeChainIds
      ] ?? networks[asset.chainId]?.name;

    return {
      icon: asset.image,
      symbol: asset.symbol,
      name: asset.title,
      balance: asset.primary,
      networkName,
      networkIcon: getImageForChainId(asset.chainId),
      fiat: formatFiatBalance(asset.secondary),
      chainId: asset.chainId,
      address: asset.address,
    };
  };

  // Filter the chain IDs to only include the requested ones.
  const requestedChainIds = parsedAccounts
    .map((chainId) => chainId)
    .filter(({ chainId }) => (chainIds ? chainIds?.includes(chainId) : true));

  // Format the assets
  const formattedNonEvmAssets = nonEvmAssets.map(formatNonEvmAsset);
  const formattedEvmAssets = evmAssets.map(formatEvmAsset);

  const assets: SnapUIAsset[] = [
    ...formattedNonEvmAssets,
    ...formattedEvmAssets,
  ];

  // Filter the assets by the requested chain IDs
  const filteredAssets = assets.filter((asset) =>
    requestedChainIds.some(({ chainId, chain: { namespace, reference } }) => {
      // Handles the "eip155:0" case
      if (namespace === KnownCaipNamespace.Eip155 && reference === '0') {
        const { namespace: assetNamepace } = parseCaipChainId(asset.chainId);
        return assetNamepace === namespace;
      }

      return chainId === asset.chainId;
    }),
  );

  return filteredAssets;
};
