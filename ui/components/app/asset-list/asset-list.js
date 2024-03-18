import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getSelectedAccountCachedBalance,
  getNativeCurrencyImage,
  getDetectedTokensInCurrentNetwork,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getShouldHideZeroBalanceTokens,
  getIsBuyableChain,
  getCurrentNetwork,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  ///: END:ONLY_INCLUDE_IF
  getSelectedAccount,
  getIsMainnet,
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
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  AssetListConversionButton,
  ///: END:ONLY_INCLUDE_IF
} from '../../multichain';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useRamps from '../../../hooks/experiences/useRamps';
///: END:ONLY_INCLUDE_IF
import { Display } from '../../../helpers/constants/design-system';

import { ReceiveModal } from '../../multichain/receive-modal';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES } from '../../multichain/asset-list-conversion-button/asset-list-conversion-button';
///: END:ONLY_INCLUDE_IF
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../helpers/utils/util';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { getCurrentLocale } from '../../../ducks/locale/locale';

const AssetList = ({ onClickAsset }) => {
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);
  const selectedAccountBalance = useSelector(getSelectedAccountCachedBalance);
  const nativeCurrency = useSelector(getNativeCurrency);
  const currentNetwork = useSelector(getCurrentNetwork);
  const currentLocale = useSelector(getCurrentLocale);
  const isMainnet = useSelector(getIsMainnet);
  const { ticker, type } = useSelector(getProviderConfig);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    currentNetwork.chainId,
    ticker,
    type,
  );
  const trackEvent = useContext(MetaMetricsContext);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const balanceIsLoading = !balance;
  const { address: selectedAddress } = useSelector(getSelectedAccount);
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

  const [primaryCurrencyDisplay, primaryCurrencyProperties] =
    useCurrencyDisplay(selectedAccountBalance, {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    });

  const [secondaryCurrencyDisplay] = useCurrencyDisplay(
    selectedAccountBalance,
    {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: secondaryCurrency,
    },
  );

  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork) || [];
  const isTokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );

  const { tokensWithBalances, totalFiatBalance, loading } =
    useAccountTotalFiatBalance(selectedAddress, shouldHideZeroBalanceTokens);
  tokensWithBalances.forEach((token) => {
    // token.string is the balance displayed in the TokenList UI
    token.string = roundToDecimalPlacesRemovingExtraZeroes(token.string, 5);
  });
  const balanceIsZero = Number(totalFiatBalance) === 0;
  const isBuyableChain = useSelector(getIsBuyableChain);
  const shouldShowBuy = isBuyableChain && balanceIsZero;
  const shouldShowReceive = balanceIsZero;
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const { openBuyCryptoInPdapp } = useRamps();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  ///: END:ONLY_INCLUDE_IF

  useEffect(() => {
    if (shouldShowBuy) {
      trackEvent({
        event: MetaMetricsEventName.EmptyBuyBannerDisplayed,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          chain_id: currentNetwork.chainId,
          locale: currentLocale,
          network: currentNetwork.nickname,
          referrer: ORIGIN_METAMASK,
        },
      });
    }
    if (shouldShowReceive) {
      trackEvent({
        event: MetaMetricsEventName.EmptyReceiveBannerDisplayed,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          chain_id: currentNetwork.chainId,
          locale: currentLocale,
          network: currentNetwork.nickname,
          referrer: ORIGIN_METAMASK,
        },
      });
    }
  }, [
    shouldShowBuy,
    shouldShowReceive,
    trackEvent,
    currentNetwork,
    currentLocale,
  ]);

  let isStakeable = isMainnet;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isStakeable = false;
  ///: END:ONLY_INCLUDE_IF

  return (
    <>
      {detectedTokens.length > 0 &&
        !isTokenDetectionInactiveOnNonMainnetSupportedNetwork && (
          <DetectedTokensBanner
            actionButtonOnClick={() => setShowDetectedTokens(true)}
            margin={4}
          />
        )}
      {shouldShowBuy || shouldShowReceive ? (
        <Box
          paddingInlineStart={4}
          paddingInlineEnd={4}
          display={Display.Flex}
          gap={2}
        >
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            shouldShowBuy ? (
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
                      chain_id: currentNetwork.chainId,
                      token_symbol: defaultSwapsToken,
                    },
                  });
                }}
              />
            ) : null
            ///: END:ONLY_INCLUDE_IF
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            shouldShowReceive ? (
              <AssetListConversionButton
                variant={ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.RECEIVE}
                onClick={() => setShowReceiveModal(true)}
              />
            ) : null
            ///: END:ONLY_INCLUDE_IF
          }
          {showReceiveModal ? (
            <ReceiveModal
              address={selectedAddress}
              onClose={() => setShowReceiveModal(false)}
            />
          ) : null}
        </Box>
      ) : null}
      <TokenListItem
        onClick={() => onClickAsset(nativeCurrency)}
        title={nativeCurrency}
        // The primary and secondary currencies are subject to change based on the user's settings
        // TODO: rename this primary/secondary concept here to be more intuitive, regardless of setting
        primary={primaryCurrencyDisplay}
        tokenSymbol={primaryCurrencyProperties.suffix}
        secondary={secondaryCurrencyDisplay}
        tokenImage={balanceIsLoading ? null : primaryTokenImage}
        isOriginalTokenSymbol={isOriginalNativeSymbol}
        isNativeCurrency
        isStakeable={isStakeable}
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
