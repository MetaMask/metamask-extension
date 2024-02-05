import React from 'react';
import { useSelector } from 'react-redux';
import {
  getCurrentCurrency,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
} from '../../../selectors';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import {
  getNativeCurrency,
  getProviderConfig,
} from '../../../ducks/metamask/metamask';
import { AssetType } from '../../../../shared/constants/transaction';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import AssetV2 from './asset-v2';

const NativeAssetV2 = () => {
  const nativeCurrency = useSelector(getNativeCurrency);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const image = useSelector(getNativeCurrencyImage);
  const showFiat = useSelector(getShouldShowFiat);
  const currentCurrency = useSelector(getCurrentCurrency);
  const { chainId, ticker, type } = useSelector(getProviderConfig);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
  );

  const [balanceDisplay] = useCurrencyDisplay(balance, {
    currency: nativeCurrency,
  });
  const [fiatDisplay] = useCurrencyDisplay(balance, {
    currency: currentCurrency,
  });

  return (
    <AssetV2
      asset={{
        type: AssetType.native,
        symbol: nativeCurrency,
        image,
        balanceDisplay,
        fiatDisplay:
          showFiat && isOriginalNativeSymbol ? fiatDisplay : undefined,
      }}
    />
  );
};

export default NativeAssetV2;
