import React, { useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { CaipChainId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import { InternalAccount } from '@metamask/keyring-internal-api';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
} from '../../component-library';
import {
  JustifyContent,
  TextVariant,
  IconColor,
} from '../../../helpers/constants/design-system';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import { I18nContext } from '../../../contexts/i18n';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  getPreferences,
  getShouldHideZeroBalanceTokens,
  getTokensMarketData,
  getIsTestnet,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getChainIdsToPoll,
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getEnabledNetworksByNamespace,
  isGlobalNetworkSelectorRemoved,
} from '../../../selectors';
import Spinner from '../../ui/spinner';

import { PercentageAndAmountChange } from '../../multichain/token-list-item/price/percentage-and-amount-change/percentage-and-amount-change';
import {
  getMultichainIsEvm,
  getMultichainShouldShowFiat,
} from '../../../selectors/multichain';
import { setPrivacyMode } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';

import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { AggregatedBalance } from '../../ui/aggregated-balance/aggregated-balance';
import WalletOverview from './wallet-overview';
import CoinButtons from './coin-buttons';
import {
  AggregatedMultichainPercentageOverview,
  AggregatedPercentageOverview,
} from './aggregated-percentage-overview';
import { AggregatedPercentageOverviewCrossChains } from './aggregated-percentage-overview-cross-chains';

export type CoinOverviewProps = {
  account: InternalAccount;
  balance: string;
  balanceIsCached: boolean;
  className?: string;
  classPrefix?: string;
  chainId: CaipChainId | Hex;
  isBridgeChain: boolean;
  isBuyableChain: boolean;
  isSwapsChain: boolean;
  isSigningEnabled: boolean;
};

export const LegacyAggregatedBalance = ({
  classPrefix,
  account,
  balance,
  balanceIsCached,
  handleSensitiveToggle,
}: {
  classPrefix: string;
  account: InternalAccount;
  balance: string;
  balanceIsCached: boolean;
  handleSensitiveToggle: () => void;
}) => {
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const enabledNetworks = useSelector(getEnabledNetworksByNamespace);

  const allChainIDs = useSelector(getChainIdsToPoll) as string[];
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    account,
  );
  const { privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);
  const isTestnet = useSelector(getIsTestnet);

  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    account,
    shouldHideZeroBalanceTokens,
    isTokenNetworkFilterEqualCurrentNetwork,
    allChainIDs,
  );

  const { totalFiatBalance } = useAccountTotalCrossChainFiatBalance(
    account,
    formattedTokensWithBalancesPerChain,
  );

  const showNativeTokenAsMain = isGlobalNetworkSelectorRemoved
    ? showNativeTokenAsMainBalance && Object.keys(enabledNetworks).length === 1
    : showNativeTokenAsMainBalance;

  const isNotAggregatedFiatBalance =
    !shouldShowFiat || showNativeTokenAsMain || isTestnet;

  let balanceToDisplay;
  if (isNotAggregatedFiatBalance) {
    balanceToDisplay = balance;
  } else {
    balanceToDisplay = totalFiatBalance;
  }

  if (!balanceToDisplay) {
    return <Spinner className="loading-overlay__spinner" />;
  }

  /**
   * Determines the currency display type based on network configuration.
   * Returns SECONDARY for multi-network setups when global network selector is removed,
   * otherwise returns PRIMARY for single network or legacy configurations.
   */
  const getCurrencyDisplayType = (): typeof PRIMARY | typeof SECONDARY => {
    const isMultiNetwork = Object.keys(enabledNetworks).length > 1;

    if (isGlobalNetworkSelectorRemoved) {
      if (isMultiNetwork && showNativeTokenAsMainBalance) {
        return SECONDARY;
      }
      return PRIMARY;
    }
    return PRIMARY;
  };

  return (
    <>
      <UserPreferencedCurrencyDisplay
        style={{ display: 'contents' }}
        account={account}
        className={classnames(`${classPrefix}-overview__primary-balance`, {
          [`${classPrefix}-overview__cached-balance`]: balanceIsCached,
        })}
        data-testid={`${classPrefix}-overview__primary-currency`}
        value={balanceToDisplay}
        type={getCurrencyDisplayType()}
        ethNumberOfDecimals={4}
        hideTitle
        shouldCheckShowNativeToken
        isAggregatedFiatOverviewBalance={
          !showNativeTokenAsMain && !isTestnet && shouldShowFiat
        }
        privacyMode={privacyMode}
      />
      <ButtonIcon
        color={IconColor.iconAlternative}
        marginLeft={2}
        size={ButtonIconSize.Md}
        onClick={handleSensitiveToggle}
        iconName={privacyMode ? IconName.EyeSlash : IconName.Eye}
        justifyContent={JustifyContent.center}
        ariaLabel="Sensitive toggle"
        data-testid="sensitive-toggle"
      />
    </>
  );
};

export const CoinOverview = ({
  account,
  balance,
  balanceIsCached,
  className,
  classPrefix = 'coin',
  chainId,
  isBridgeChain,
  isBuyableChain,
  isSwapsChain,
  isSigningEnabled,
}: CoinOverviewProps) => {
  const enabledNetworks = useSelector(getEnabledNetworksByNamespace);

  const t: ReturnType<typeof useI18nContext> = useContext(I18nContext);

  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const dispatch = useDispatch();

  const { privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);

  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const isEvm = useSelector(getMultichainIsEvm);

  const tokensMarketData = useSelector(getTokensMarketData);

  const handleSensitiveToggle = () => {
    dispatch(setPrivacyMode(!privacyMode));
  };

  const handlePortfolioOnClick = useCallback(() => {
    const url = getPortfolioUrl(
      '',
      'ext_portfolio_button',
      metaMetricsId,
      isMetaMetricsEnabled,
      isMarketingEnabled,
    );
    global.platform.openTab({ url });
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PortfolioLinkClicked,
      properties: {
        location: 'Home',
        text: 'Portfolio',
      },
    });
  }, [isMarketingEnabled, isMetaMetricsEnabled, metaMetricsId, trackEvent]);

  const renderPercentageAndAmountChange = () => {
    const renderPortfolioButton = () => {
      return (
        <ButtonLink
          endIconName={IconName.Export}
          onClick={handlePortfolioOnClick}
          as="a"
          data-testid="portfolio-link"
          textProps={{ variant: TextVariant.bodyMdMedium }}
        >
          {t('discover')}
        </ButtonLink>
      );
      return null;
    };

    const renderNativeTokenView = () => (
      <Box className="wallet-overview__currency-wrapper">
        <PercentageAndAmountChange
          value={
            tokensMarketData?.[getNativeTokenAddress(chainId as Hex)]
              ?.pricePercentChange1d
          }
        />
        {renderPortfolioButton()}
      </Box>
    );

    const renderAggregatedView = () => (
      <Box className="wallet-overview__currency-wrapper">
        {isTokenNetworkFilterEqualCurrentNetwork ? (
          <AggregatedPercentageOverview />
        ) : (
          <AggregatedPercentageOverviewCrossChains />
        )}
        {renderPortfolioButton()}
      </Box>
    );

    const renderNonEvmView = () => (
      <Box className="wallet-overview__currency-wrapper">
        <AggregatedMultichainPercentageOverview privacyMode={privacyMode} />
        {renderPortfolioButton()}
      </Box>
    );

    if (!isEvm) {
      return renderNonEvmView();
    }

    return showNativeTokenAsMainBalance &&
      Object.keys(enabledNetworks).length === 1
      ? renderNativeTokenView()
      : renderAggregatedView();
  };

  return (
    <WalletOverview
      balance={
        <Tooltip
          position="top"
          title={t('balanceOutdated')}
          disabled={!balanceIsCached}
        >
          <div className={`${classPrefix}-overview__balance`}>
            <div className={`${classPrefix}-overview__primary-container`}>
              {isEvm ? (
                <LegacyAggregatedBalance
                  classPrefix={classPrefix}
                  account={account}
                  balance={balance}
                  balanceIsCached={balanceIsCached}
                  handleSensitiveToggle={handleSensitiveToggle}
                />
              ) : (
                <AggregatedBalance
                  classPrefix={classPrefix}
                  balanceIsCached={balanceIsCached}
                  handleSensitiveToggle={handleSensitiveToggle}
                />
              )}
              {balanceIsCached && (
                <span className={`${classPrefix}-overview__cached-star`}>
                  *
                </span>
              )}
            </div>
            {renderPercentageAndAmountChange()}
          </div>
        </Tooltip>
      }
      buttons={
        <CoinButtons
          {...{
            account,
            trackingLocation: 'home',
            chainId,
            isSwapsChain,
            isSigningEnabled,
            isBridgeChain,
            isBuyableChain,
            classPrefix,
          }}
        />
      }
      className={className}
    />
  );
};
