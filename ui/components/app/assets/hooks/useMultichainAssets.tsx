import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { getMultichainBalances } from '../../../../selectors/multichain';
import {
  getAccountAssets,
  getAssetsMetadata,
} from '../../../../selectors/assets';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/network';
import { getSelectedInternalAccount } from '../../../../selectors';
import {
  TranslateFunction,
  networkTitleOverrides,
} from '../util/networkTitleOverrides';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getAssetsRates } from '../../../../selectors/multichain-assets-rates';
import { formatWithThreshold } from '../util/formatWithThreshold';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';

const useMultiChainAssets = () => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const currentCurrency = useSelector(getCurrentCurrency);
  const account = useSelector(getSelectedInternalAccount);
  const multichainBalances = useSelector(getMultichainBalances);
  const accountAssets = useSelector(getAccountAssets);
  const assetsMetadata = useSelector(getAssetsMetadata);
  const assetRates = useSelector(getAssetsRates);

  const assetIds = accountAssets[account.id] || [];
  const balances = multichainBalances[account.id];

  return assetIds.map((assetId) => {
    const [chainId, assetDetails] = assetId.split('/');
    const isToken = assetDetails.split(':')[0] === 'token';

    const balance = balances[assetId] || { amount: '0', unit: '' };
    const rate = assetRates[assetId]?.rate || '0';
    const fiatBalance = parseFloat(rate) * parseFloat(balance.amount);

    const fiatAmount = formatWithThreshold(fiatBalance, 0.01, locale, {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    });

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
      secondary: fiatAmount, // secondary balance (usually in fiat)
      string: '',
      tokenFiatAmount: fiatBalance, // for now we are keeping this is to satisfy sort, this should be fiat amount
      isStakeable: false,
    };
  });
};

export default useMultiChainAssets;
