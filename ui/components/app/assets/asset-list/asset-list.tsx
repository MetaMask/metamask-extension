import React, { useContext, useState } from 'react';
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
} from '../../../multichain';
import { useAccountTotalFiatBalance } from '../../../../hooks/useAccountTotalFiatBalance';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import {
  showPrimaryCurrency,
  showSecondaryCurrency,
} from '../../../../../shared/modules/currency-display.utils';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../helpers/utils/util';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  RAMPS_CARD_VARIANT_TYPES,
  RampsCard,
} from '../../../multichain/ramps-card/ramps-card';
import { getIsNativeTokenBuyable } from '../../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF

export type TokenWithBalance = {
  address: string;
  symbol: string;
  string: string;
  image: string;
};

type AssetListProps = {
  onClickAsset: (arg: string) => void;
  showTokensLinks: boolean;
};

const AssetList = ({ onClickAsset, showTokensLinks }: AssetListProps) => {
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);
  const nativeCurrency = useSelector(getMultichainNativeCurrency);
  const showFiat = useSelector(getMultichainShouldShowFiat);
  const isMainnet = useSelector(getMultichainIsMainnet);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const { chainId, ticker, type, rpcUrl } = useSelector(
    getMultichainCurrentNetwork,
  );
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );
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
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

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

  const accountTotalFiatBalance = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  const tokensWithBalances =
    accountTotalFiatBalance.tokensWithBalances as TokenWithBalance[];

  const { loading } = accountTotalFiatBalance;

  tokensWithBalances.forEach((token) => {
    token.string = roundToDecimalPlacesRemovingExtraZeroes(
      token.string,
      5,
    ) as string;
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
            className=""
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
            useNativeCurrencyAsPrimaryCurrency,
          )
            ? secondaryCurrencyDisplay
            : undefined
        }
        tokenSymbol={
          useNativeCurrencyAsPrimaryCurrency
            ? primaryCurrencyProperties.suffix
            : secondaryCurrencyProperties.suffix
        }
        secondary={
          showFiat &&
          showPrimaryCurrency(
            isOriginalNativeSymbol,
            useNativeCurrencyAsPrimaryCurrency,
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
        onTokenClick={(tokenAddress: string) => {
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
    </>
  );
};

export default AssetList;
