import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getNativeCurrencyImage,
  getDetectedTokensInCurrentNetwork,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getShouldHideZeroBalanceTokens,
  getIsBuyableChain,
  getCurrentChainId,
  getSwapsDefaultToken,
  getSelectedAddress,
  getPreferences,
} from '../../../selectors';
import {
  getNativeCurrency,
  getProviderConfig,
} from '../../../ducks/metamask/metamask';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import Box from '../../ui/box/box';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import DetectedToken from '../detected-token/detected-token';
import {
  DetectedTokensBanner,
  TokenListItem,
  ImportTokenLink,
  BalanceOverview,
  AssetListConversionButton,
} from '../../multichain';

import useRamps from '../../../hooks/experiences/useRamps';
import { Display } from '../../../helpers/constants/design-system';

import { ReceiveModal } from '../../multichain/receive-modal';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import { ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES } from '../../multichain/asset-list-conversion-button/asset-list-conversion-button';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import {
  showPrimaryCurrency,
  showSecondaryCurrency,
} from '../../../../shared/modules/currency-display.utils';

const AssetList = ({ onClickAsset }) => {
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);
  const selectedAccountBalance = useSelector(getSelectedAccountCachedBalance);
  const nativeCurrency = useSelector(getNativeCurrency);
  const showFiat = useSelector(getShouldShowFiat);
  const chainId = useSelector(getCurrentChainId);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const { ticker, type } = useSelector(getProviderConfig);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
  );
  const trackEvent = useContext(MetaMetricsContext);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const balanceIsLoading = !balance;
  const selectedAddress = useSelector(getSelectedAddress);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(
    selectedAccountBalance,
    {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    },
  );

  const [secondaryCurrencyDisplay, secondaryCurrencyProperties] =
    useCurrencyDisplay(selectedAccountBalance, {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: secondaryCurrency,
    });

  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork) || [];
  const isTokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );

  const { tokensWithBalances, totalFiatBalance, totalWeiBalance, loading } =
    useAccountTotalFiatBalance(selectedAddress, shouldHideZeroBalanceTokens);

  const balanceIsZero = Number(totalFiatBalance) === 0;
  const isBuyableChain = useSelector(getIsBuyableChain);
  const shouldShowBuy = isBuyableChain && balanceIsZero;
  const shouldShowReceive = balanceIsZero;
  const { openBuyCryptoInPdapp } = useRamps();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);

  return (
    <>
      {process.env.MULTICHAIN ? (
        <BalanceOverview balance={totalWeiBalance} loading={loading} />
      ) : null}
      {detectedTokens.length > 0 &&
        !isTokenDetectionInactiveOnNonMainnetSupportedNetwork && (
          <DetectedTokensBanner
            actionButtonOnClick={() => setShowDetectedTokens(true)}
            margin={4}
          />
        )}
      {process.env.MULTICHAIN && (shouldShowBuy || shouldShowReceive) ? (
        <Box
          paddingInlineStart={4}
          paddingInlineEnd={4}
          display={Display.Flex}
          gap={2}
        >
          {shouldShowBuy ? (
            <AssetListConversionButton
              variant={ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.BUY}
              onClick={() => {
                openBuyCryptoInPdapp();
                trackEvent({
                  event: MetaMetricsEventName.NavBuyButtonClicked,
                  category: MetaMetricsEventCategory.Navigation,
                  properties: {
                    location: 'Home',
                    text: 'Buy',
                    chain_id: chainId,
                    token_symbol: defaultSwapsToken,
                  },
                });
              }}
            />
          ) : null}
          {shouldShowReceive ? (
            <AssetListConversionButton
              variant={ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.RECEIVE}
              onClick={() => setShowReceiveModal(true)}
            />
          ) : null}
          {showReceiveModal ? (
            <ReceiveModal
              address={selectedAddress}
              onClose={() => setShowReceiveModal(false)}
            />
          ) : null}
        </Box>
      ) : (
        <>
          <TokenListItem
            onClick={() => onClickAsset(nativeCurrency)}
            title={nativeCurrency}
            primary={
              showPrimaryCurrency(
                isOriginalNativeSymbol,
                useNativeCurrencyAsPrimaryCurrency,
              )
                ? primaryCurrencyProperties.value ??
                  secondaryCurrencyProperties.value
                : null
            }
            tokenSymbol={
              showPrimaryCurrency(
                isOriginalNativeSymbol,
                useNativeCurrencyAsPrimaryCurrency,
              )
                ? primaryCurrencyProperties.suffix
                : null
            }
            secondary={
              showFiat &&
              showSecondaryCurrency(
                isOriginalNativeSymbol,
                useNativeCurrencyAsPrimaryCurrency,
              )
                ? secondaryCurrencyDisplay
                : undefined
            }
            tokenImage={balanceIsLoading ? null : primaryTokenImage}
            isOriginalTokenSymbol={isOriginalNativeSymbol}
            isNativeCurrency
          />
          <TokenList
            tokens={tokensWithBalances}
            loading={loading}
            onTokenClick={(tokenAddress) => {
              onClickAsset(tokenAddress);
              trackEvent({
                event: MetaMetricsEventName.TokenScreenOpened,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  token_symbol: primaryCurrencyProperties.suffix,
                  location: 'Home',
                },
              });
            }}
          />
        </>
      )}
      <Box marginTop={detectedTokens.length > 0 ? 0 : 4}>
        <ImportTokenLink margin={4} marginBottom={2} />
      </Box>
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
    </>
  );
};

AssetList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default AssetList;
