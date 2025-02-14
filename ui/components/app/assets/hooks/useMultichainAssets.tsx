import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { getMultichainBalances } from '../../../../selectors/multichain';
import {
  getAccountAssets,
  getAssetsMetadata,
} from '../../../../selectors/assets';
import { ParsedAssetId, parseAssetId } from '../util/parseAssetId';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/network';

const accountId = 'e0bcfad0-2d3f-48cd-b50f-8a2f1d4f7dea';

const useMultiChainAssets = () => {
  const multichainBalances = useSelector(getMultichainBalances);
  const accountAssets = useSelector(getAccountAssets);
  const assetsMetadata = useSelector(getAssetsMetadata);

  const assetIds = accountAssets[accountId] || [];

  const parsedAssetIds: Record<string, ParsedAssetId> = {};
  for (let assetId of assetIds) {
    const parsedAssetId = parseAssetId(assetId);
    parsedAssetIds[assetId] = parsedAssetId;
  }

  const balances = multichainBalances[accountId];
  return assetIds.map((assetId) => {
    const balance = balances[assetId] || { amount: '0', unit: '' };
    const metadata = assetsMetadata[assetId] || {
      name: balance.unit,
      symbol: balance.unit || 'Unknown',
      fungible: true,
      units: [
        { name: assetId, symbol: balance.unit || 'Unknown', decimals: 0 },
      ],
    };

    const decimals = metadata.units[0]?.decimals || 0;

    const parsedCaip = parsedAssetIds[assetId];

    let tokenImage = '';

    if (parsedCaip.assetNamespace === 'token') {
      tokenImage = metadata.iconUrl || '';
    } else {
      tokenImage = CHAIN_ID_TOKEN_IMAGE_MAP['solana'] || '';
    }

    return {
      title: metadata.name,
      address: assetId as Hex,
      symbol: metadata.symbol,
      image: tokenImage,
      decimals,
      chainId: 'solana',
      isNative: false,
      primary: balance.amount,
      secondary: balance.amount,
      string: balance.amount,
      tokenFiatAmount: balance.amount,
      isStakeable: false,
    };
  });
};

export default useMultiChainAssets;
