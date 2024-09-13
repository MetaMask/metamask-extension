import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import {
  getDetectedTokensInCurrentNetwork,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getShouldHideZeroBalanceTokens,
  getSelectedAccount,
  getPreferences,
} from '../../../../selectors';
import {
  getMultichainCurrentNetwork,
  getMultichainNativeCurrency,
  getMultichainIsEvm,
  getMultichainShouldShowFiat,
  getMultichainCurrencyImage,
  getMultichainIsMainnet,
  getMultichainSelectedAccountCachedBalance,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getMultichainIsBitcoin,
  ///: END:ONLY_INCLUDE_IF
  getMultichainSelectedAccountCachedBalanceIsZero,
} from '../../../../selectors/multichain';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import DetectedToken from '../../detected-token/detected-token';
import {
  DetectedTokensBanner,
  TokenListItem,
  ImportTokenLink,
  ReceiveModal,
} from '../../../multichain';
import { useAccountTotalFiatBalance } from '../../../../hooks/useAccountTotalFiatBalance';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  showPrimaryCurrency,
  showSecondaryCurrency,
} from '../../../../../shared/modules/currency-display.utils';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../helpers/utils/util';
import { FundingMethodModal } from '../../../multichain/funding-method-modal/funding-method-modal';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  RAMPS_CARD_VARIANT_TYPES,
  RampsCard,
} from '../../../multichain/ramps-card/ramps-card';
import { getIsNativeTokenBuyable } from '../../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF

const AssetList = ({ onClickAsset, showTokensLinks }) => {
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);
  const nativeCurrency = useSelector(getMultichainNativeCurrency);
  const showFiat = useSelector(getMultichainShouldShowFiat);
  const isMainnet = useSelector(getMultichainIsMainnet);
  const { showNativeTokenAsMainBalance } = useSelector(getPreferences);
  const { chainId, ticker, type, rpcUrl } = useSelector(
    getMultichainCurrentNetwork,
  );
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const balanceIsLoading = !balance;
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, {
    ethNumberOfDecimals: 4,
    shouldCheckShowNativeToken: true,
  });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, {
    ethNumberOfDecimals: 4,
    shouldCheckShowNativeToken: true,
  });

  const [primaryCurrencyDisplay, primaryCurrencyProperties] =
    useCurrencyDisplay(balance, {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    });

  const [secondaryCurrencyDisplay, secondaryCurrencyProperties] =
    useCurrencyDisplay(balance, {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: secondaryCurrency,
    });

  const primaryTokenImage = useSelector(getMultichainCurrencyImage);
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork) || [];
  const isTokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );

  const [showFundingMethodModal, setShowFundingMethodModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const onClickReceive = () => {
    setShowFundingMethodModal(false);
    setShowReceiveModal(true);
  };

  const { tokensWithBalances, loading } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );
  tokensWithBalances.forEach((token) => {
    // token.string is the balance displayed in the TokenList UI
    token.string = roundToDecimalPlacesRemovingExtraZeroes(token.string, 5);
  });

  const balanceIsZero = useSelector(
    getMultichainSelectedAccountCachedBalanceIsZero,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const shouldShowBuy = isBuyableChain && balanceIsZero;
  ///: END:ONLY_INCLUDE_IF

  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBtc = useSelector(getMultichainIsBitcoin);
  ///: END:ONLY_INCLUDE_IF

  let isStakeable = isMainnet && isEvm;
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
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        shouldShowBuy ? (
          <RampsCard
            variant={
              isBtc
                ? RAMPS_CARD_VARIANT_TYPES.BTC
                : RAMPS_CARD_VARIANT_TYPES.TOKEN
            }
            handleOnClick={
              isBtc ? undefined : () => setShowFundingMethodModal(true)
            }
          />
        ) : null
        ///: END:ONLY_INCLUDE_IF
      }
      <TokenListItem
        onClick={() => onClickAsset(nativeCurrency)}
        title={nativeCurrency}
        // The primary and secondary currencies are subject to change based on the user's settings
        // TODO: rename this primary/secondary concept here to be more intuitive, regardless of setting
        primary={
          showSecondaryCurrency(
            isOriginalNativeSymbol,
            showNativeTokenAsMainBalance,
          )
            ? secondaryCurrencyDisplay
            : undefined
        }
        tokenSymbol={
          showNativeTokenAsMainBalance
            ? primaryCurrencyProperties.suffix
            : secondaryCurrencyProperties.suffix
        }
        secondary={
          showFiat &&
          showPrimaryCurrency(
            isOriginalNativeSymbol,
            showNativeTokenAsMainBalance,
          )
            ? primaryCurrencyDisplay
            : undefined
        }
        tokenImage={balanceIsLoading ? null : primaryTokenImage}
        isOriginalTokenSymbol={isOriginalNativeSymbol}
        isNativeCurrency
        isStakeable={isStakeable}
        showPercentage
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
      {shouldShowTokensLinks && (
        <ImportTokenLink
          margin={4}
          marginBottom={2}
          marginTop={detectedTokens.length > 0 && !balanceIsZero ? 0 : 2}
        />
      )}
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
      {showReceiveModal && selectedAccount?.address && (
        <ReceiveModal
          address={selectedAccount.address}
          onClose={() => setShowReceiveModal(false)}
        />
      )}
      {showFundingMethodModal && (
        <FundingMethodModal
          isOpen={showFundingMethodModal}
          onClose={() => setShowFundingMethodModal(false)}
          title={t('selectFundingMethod')}
          onClickReceive={onClickReceive}
        />
      )}
    </>
  );
};

AssetList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
  showTokensLinks: PropTypes.bool,
};

export default AssetList;
