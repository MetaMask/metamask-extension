import {
  CaipAccountId,
  CaipAssetType,
  CaipChainId,
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { getMemoizedInternalAccountByAddress } from '../../../../selectors';
import { getMultiChainAssets } from '../../../../selectors/assets';
import { TokenWithFiatAmount } from '../../assets/types';

import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatWithThreshold } from '../../assets/util/formatWithThreshold';
import {
  getImageForChainId,
  getMemoizedMultichainNetworkConfigurationsByChainId,
} from '../../../../selectors/multichain';
import {
  AllowedBridgeChainIds,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../shared/constants/bridge';
import { getMemoizedCurrentCurrency } from '../../../../selectors/snaps';

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
  const currentCurrency = useSelector(getMemoizedCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  const parsedAccounts = addresses.map(parseCaipAccountId);

  const account = useSelector((state) =>
    getMemoizedInternalAccountByAddress(state, parsedAccounts[0].address),
  );
  const networks = useSelector(
    getMemoizedMultichainNetworkConfigurationsByChainId,
  );

  const assets = useSelector((state) => getMultiChainAssets(state, account));

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
   * Formats an asset balance.
   *
   * @param balance - The balance to format.
   * @returns The formatted balance.
   */
  const formatAssetBalance = (balance: string) => {
    const parsedBalance = parseFloat(balance);
    return formatWithThreshold(parsedBalance, 0.00001, locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5,
    });
  };

  /**
   * Formats a non-EVM asset for the SnapUIAssetSelector.
   *
   * @param asset - The asset to format.
   * @returns The formatted asset.
   */
  const formatAsset = (asset: TokenWithFiatAmount) => {
    const networkName =
      NETWORK_TO_SHORT_NETWORK_NAME_MAP[
        asset.chainId as AllowedBridgeChainIds
      ] ?? networks[asset.chainId]?.name;

    return {
      icon: asset.image,
      symbol: asset.symbol,
      name: asset.title,
      balance: formatAssetBalance(asset.primary),
      networkName,
      networkIcon: getImageForChainId(asset.chainId),
      fiat: formatFiatBalance(asset.secondary),
      chainId: asset.chainId as CaipChainId,
      address: asset.address as CaipAssetType,
    };
  };

  // Filter the chain IDs to only include the requested ones.
  const requestedChainIds = parsedAccounts
    .map((chainId) => chainId)
    .filter(({ chainId }) => (chainIds ? chainIds?.includes(chainId) : true));

  const formattedAssets = useMemo(() => {
    // Filter the assets by the requested chain IDs
    const filteredAssets = assets.filter((asset) =>
      requestedChainIds.some(({ chainId, chain: { namespace, reference } }) => {
        // Handles the "eip155:0" case
        if (namespace === KnownCaipNamespace.Eip155 && reference === '0') {
          const { namespace: assetNamepace } = parseCaipChainId(
            asset.chainId as CaipChainId,
          );
          return assetNamepace === namespace;
        }

        return chainId === asset.chainId;
      }),
    );

    // Format the assets
    const formatted: SnapUIAsset[] = filteredAssets.map(formatAsset);

    return formatted;
  }, [assets]);

  return formattedAssets;
};
