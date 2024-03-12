import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';
import {
  getCurrentCurrency,
  getNativeCurrencyImage,
  getRpcPrefsForCurrentProvider,
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getShouldShowFiat,
} from '../../../selectors';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import {
  getConversionRate,
  getNativeCurrency,
  getProviderConfig,
} from '../../../ducks/metamask/metamask';
import { AssetType } from '../../../../shared/constants/transaction';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import AssetOptions from './asset-options';
import AssetV2 from './asset-v2';

const NativeAssetV2 = () => {
  const nativeCurrency = useSelector(getNativeCurrency);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const image = useSelector(getNativeCurrencyImage);
  const showFiat = useSelector(getShouldShowFiat);
  const currentCurrency = useSelector(getCurrentCurrency);
  const { chainId, ticker, type } = useSelector(getProviderConfig);
  const { address } = useSelector(getSelectedInternalAccount);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const conversionRate = useSelector(getConversionRate);

  const accountLink = getAccountLink(address, chainId, rpcPrefs);
  const trackEvent = useContext(MetaMetricsContext);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
  );

  const [, { value: balanceDisplay }] = useCurrencyDisplay(balance, {
    currency: nativeCurrency,
  });
  const [fiatDisplay] = useCurrencyDisplay(balance, {
    currency: currentCurrency,
  });

  return (
    <AssetV2
      asset={{
        chainId,
        type: AssetType.native,
        symbol: nativeCurrency,
        image,
        balance: {
          value: hexToDecimal(balance),
          display: balanceDisplay,
          fiat: showFiat && isOriginalNativeSymbol ? fiatDisplay : undefined,
        },
        isOriginalNativeSymbol: isOriginalNativeSymbol === true,
        currentPrice: showFiat && conversionRate,
      }}
      optionsButton={
        <AssetOptions
          isNativeAsset={true}
          onClickBlockExplorer={() => {
            trackEvent({
              event: 'Clicked Block Explorer Link',
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                link_type: 'Account Tracker',
                action: 'Asset Options',
                block_explorer_domain: getURLHostName(accountLink),
              },
            });
            global.platform.openTab({
              url: accountLink,
            });
          }}
        />
      }
    />
  );
};

export default NativeAssetV2;
