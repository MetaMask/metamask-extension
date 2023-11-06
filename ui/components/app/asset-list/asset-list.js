import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
<<<<<<< HEAD
import ImportTokenLink from '../import-token-link';
=======
>>>>>>> upstream/multichain-swaps-controller
import TokenList from '../token-list';
import AssetListItem from '../asset-list-item';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getNativeCurrencyImage,
  getDetectedTokensInCurrentNetwork,
<<<<<<< HEAD
=======
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getShouldHideZeroBalanceTokens,
  getIsBuyableChain,
  getCurrentChainId,
  getSwapsDefaultToken,
  getSelectedAddress,
>>>>>>> upstream/multichain-swaps-controller
} from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import Typography from '../../ui/typography/typography';
import Box from '../../ui/box/box';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT } from '../../../../shared/constants/metametrics';
import DetectedToken from '../detected-token/detected-token';
<<<<<<< HEAD
import DetectedTokensLink from './detetcted-tokens-link/detected-tokens-link';
=======
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
>>>>>>> upstream/multichain-swaps-controller

const AssetList = ({ onClickAsset }) => {
  const t = useI18nContext();

  const [showDetectedTokens, setShowDetectedTokens] = useState(false);

  const selectedAccountBalance = useSelector(getSelectedAccountCachedBalance);
  const nativeCurrency = useSelector(getNativeCurrency);
  const showFiat = useSelector(getShouldShowFiat);
  const trackEvent = useContext(MetaMetricsContext);
<<<<<<< HEAD
=======
  const balance = useSelector(getSelectedAccountCachedBalance);
  const balanceIsLoading = !balance;
  const selectedAddress = useSelector(getSelectedAddress);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const [showReceiveModal, setShowReceiveModal] = useState(false);
>>>>>>> upstream/multichain-swaps-controller

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

  const [
    secondaryCurrencyDisplay,
    secondaryCurrencyProperties,
  ] = useCurrencyDisplay(selectedAccountBalance, {
    numberOfDecimals: secondaryNumberOfDecimals,
    currency: secondaryCurrency,
  });

  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork) || [];
<<<<<<< HEAD

  return (
    <>
      <AssetListItem
        onClick={() => onClickAsset(nativeCurrency)}
        data-testid="wallet-balance"
        primary={
          primaryCurrencyProperties.value ?? secondaryCurrencyProperties.value
        }
        tokenSymbol={primaryCurrencyProperties.suffix}
        secondary={showFiat ? secondaryCurrencyDisplay : undefined}
        tokenImage={primaryTokenImage}
        identiconBorder
      />
      <TokenList
        onTokenClick={(tokenAddress) => {
          onClickAsset(tokenAddress);
          trackEvent({
            event: 'Clicked Token',
            category: EVENT.CATEGORIES.NAVIGATION,
            properties: {
              action: 'Token Menu',
              legacy_event: true,
            },
          });
        }}
      />
      {process.env.TOKEN_DETECTION_V2
        ? detectedTokens.length > 0 && (
            <DetectedTokensLink setShowDetectedTokens={setShowDetectedTokens} />
          )
        : null}
=======
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
  const chainId = useSelector(getCurrentChainId);
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
              primaryCurrencyProperties.value ??
              secondaryCurrencyProperties.value
            }
            tokenSymbol={primaryCurrencyProperties.suffix}
            secondary={showFiat ? secondaryCurrencyDisplay : undefined}
            tokenImage={balanceIsLoading ? null : primaryTokenImage}
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
>>>>>>> upstream/multichain-swaps-controller
      <Box marginTop={detectedTokens.length > 0 ? 0 : 4}>
        <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
          <Typography
            color={COLORS.TEXT_ALTERNATIVE}
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.NORMAL}
          >
            {t('missingToken')}
          </Typography>
        </Box>
        <ImportTokenLink />
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
