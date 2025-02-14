import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { getMultichainBalances } from '../../../../selectors/multichain';
import {
  getAccountAssets,
  getAssetsMetadata,
} from '../../../../selectors/assets';
import { ParsedAssetId, parseAssetId } from '../util/parseAssetId';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/network';
import { getSelectedInternalAccount } from '../../../../selectors';
import {
  TranslateFunction,
  networkTitleOverrides,
} from '../util/networkTitleOverrides';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const useMultiChainAssets = () => {
  const t = useI18nContext();
  const account = useSelector(getSelectedInternalAccount);
  const multichainBalances = useSelector(getMultichainBalances);
  const accountAssets = useSelector(getAccountAssets);
  const assetsMetadata = useSelector(getAssetsMetadata);

  const assetIds = accountAssets[account.id] || [];

  const parsedAssetIds: Record<string, ParsedAssetId> = {};
  for (let assetId of assetIds) {
    const parsedAssetId = parseAssetId(assetId);
    parsedAssetIds[assetId] = parsedAssetId;
  }

  const balances = multichainBalances[account.id];
  return assetIds.map((assetId) => {
    const [chainId, assetDetails] = assetId.split('/');
    const isToken = assetDetails.split(':')[0] === 'token';

    const balance = balances[assetId] || { amount: '0', unit: '' };
    const metadata = assetsMetadata[assetId] || {
      name: balance.unit,
      symbol: balance.unit || '',
      fungible: true,
      units: [{ name: assetId, symbol: balance.unit || '', decimals: 0 }],
    };

    let tokenImage = '';

    if (isToken) {
      tokenImage = metadata.iconUrl || '';
    } else {
      tokenImage =
        CHAIN_ID_TOKEN_IMAGE_MAP[
          chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
        ] || '';
    }

    const decimals = metadata.units[0]?.decimals || 0;

    return {
      title: isToken
        ? metadata.name
        : networkTitleOverrides(t as TranslateFunction, {
            title: balance.unit,
          }),
      address: assetId as Hex,
      symbol: metadata.symbol,
      image: tokenImage,
      decimals,
      chainId,
      isNative: false,
      primary: balance.amount,
      secondary: '', // secondary balance (usually in fiat)
      string: '',
      tokenFiatAmount: '',
      isStakeable: false,
    };
  });
};

export default useMultiChainAssets;
