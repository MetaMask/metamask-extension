import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import TokenList from '../token-list';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getNativeCurrencyImage,
  getDetectedTokensInCurrentNetwork,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
<<<<<<< HEAD
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
  getCurrentCurrency,
=======
  getIsBuyableChain,
  getCurrentChainId,
  getSwapsDefaultToken,
>>>>>>> 61a38efefe (Fix #19371 - Provide conversion buttons for empty accounts)
} from '../../../selectors';
import {
  getConversionRate,
  getNativeCurrency,
  getTokens,
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
<<<<<<< HEAD
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { getTokenFiatAmount } from '../../../helpers/utils/token-util';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import {
  getValueFromWeiHex,
  sumDecimals,
} from '../../../../shared/modules/conversion.utils';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
=======
import useRamps from '../../../hooks/experiences/useRamps';
import { Display } from '../../../helpers/constants/design-system';
>>>>>>> 61a38efefe (Fix #19371 - Provide conversion buttons for empty accounts)

const AssetList = ({ onClickAsset }) => {
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);

  const selectedAccountBalance = useSelector(getSelectedAccountCachedBalance);
  const nativeCurrency = useSelector(getNativeCurrency);
  const showFiat = useSelector(getShouldShowFiat);
  const trackEvent = useContext(MetaMetricsContext);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const balanceIsLoading = !balance;

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

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const nativeFiat = getValueFromWeiHex({
    value: balance,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  // use `isEqual` comparison function because the token array is serialized
  // from the background so it has a new reference with each background update,
  // even if the tokens haven't changed
  const tokens = useSelector(getTokens, isEqual);
  const { loading, tokensWithBalances } = useTokenTracker(
    tokens,
    true,
    shouldHideZeroBalanceTokens,
  );

  const dollarBalances = tokensWithBalances.map((token) => {
    const contractExchangeTokenKey = Object.keys(contractExchangeRates).find(
      (key) => isEqualCaseInsensitive(key, token.address),
    );
    const tokenExchangeRate =
      (contractExchangeTokenKey &&
        contractExchangeRates[contractExchangeTokenKey]) ??
      0;

    const fiat = getTokenFiatAmount(
      tokenExchangeRate,
      conversionRate,
      currentCurrency,
      token.string,
      token.symbol,
      false,
      false,
    );

    return fiat;
  });

  const totalFiat = formatCurrency(
    sumDecimals(nativeFiat, ...dollarBalances).toString(10),
    currentCurrency,
  );
  // Hardcoded for the sake of dev
  const shouldShowBuy = useSelector(getIsBuyableChain);
  const shouldShowReceive = true;
  const { openBuyCryptoInPdapp } = useRamps();
  const chainId = useSelector(getCurrentChainId);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);

  return (
    <>
      {process.env.MULTICHAIN ? (
        <BalanceOverview balance={totalFiat} loading={loading} />
      ) : null}
      {detectedTokens.length > 0 &&
        !isTokenDetectionInactiveOnNonMainnetSupportedNetwork && (
          <DetectedTokensBanner
            actionButtonOnClick={() => setShowDetectedTokens(true)}
            margin={4}
          />
        )}
      {shouldShowBuy || shouldShowReceive ? (
        <Box paddingLeft={4} paddingRight={4} display={Display.Flex} gap={2}>
          {shouldShowBuy ? (
            <AssetListConversionButton
              variant="buy"
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
              onClose={() => {
                // TODO: What happens when this is clicked?
              }}
            />
          ) : null}
          {shouldShowReceive ? (
            <AssetListConversionButton
              variant="receive"
              onClick={() => {
                // TODO
              }}
              onClose={() => {
                // TODO: What happens when this is clicked?
              }}
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
