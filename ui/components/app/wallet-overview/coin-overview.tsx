import React, { useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { CaipChainId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import { InternalAccount } from '@metamask/keyring-internal-api';
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
  getIsTestnet,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getChainIdsToPoll,
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getEnabledNetworksByNamespace,
  isGlobalNetworkSelectorRemoved,
  getIsMultichainAccountsState2Enabled,
} from '../../../selectors';
import { AccountGroupBalance } from '../assets/account-group-balance/account-group-balance';
import Spinner from '../../ui/spinner';

import { AccountGroupBalanceChange } from '../assets/account-group-balance-change/account-group-balance-change';
import {
  getMultichainIsEvm,
  getMultichainShouldShowFiat,
} from '../../../selectors/multichain';
import { setPrivacyMode } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';
import { AggregatedBalance } from '../../ui/aggregated-balance/aggregated-balance';

import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
// removed state2 inline render experiment; use dedicated component
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
  const t: ReturnType<typeof useI18nContext> = useContext(I18nContext);

  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const dispatch = useDispatch();

  const { privacyMode } = useSelector(getPreferences);

  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const isEvm = useSelector(getMultichainIsEvm);

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  // State2 balance is rendered via dedicated component

  const handleSensitiveToggle = () => {
    dispatch(setPrivacyMode(!privacyMode));
  };

  const handlePortfolioOnClick = useCallback(() => {
    const url = getPortfolioUrl(
      'explore/tokens',
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
    };

    const renderAggregatedView = () => {
      const content = isTokenNetworkFilterEqualCurrentNetwork ? (
        <AggregatedPercentageOverview />
      ) : (
        <AggregatedPercentageOverviewCrossChains />
      );
      return (
        <Box className="wallet-overview__currency-wrapper">
          {content}
          {renderPortfolioButton()}
        </Box>
      );
    };

    const renderNonEvmView = () => (
      <Box className="wallet-overview__currency-wrapper">
        <AggregatedMultichainPercentageOverview privacyMode={privacyMode} />
        {renderPortfolioButton()}
      </Box>
    );

    // Early exit for state2 unified view
    if (isMultichainAccountsState2Enabled) {
      return (
        <Box className="wallet-overview__currency-wrapper">
          <AccountGroupBalanceChange period="1d" />
          {renderPortfolioButton()}
        </Box>
      );
    }

    if (!isEvm) {
      return renderNonEvmView();
    }

    return renderAggregatedView();
  };

  let balanceSection: React.ReactNode;
  if (isMultichainAccountsState2Enabled) {
    balanceSection = (
      <AccountGroupBalance
        classPrefix={classPrefix}
        balanceIsCached={balanceIsCached}
        handleSensitiveToggle={handleSensitiveToggle}
      />
    );
  } else if (isEvm) {
    balanceSection = (
      <LegacyAggregatedBalance
        classPrefix={classPrefix}
        account={account}
        balance={balance}
        balanceIsCached={balanceIsCached}
        handleSensitiveToggle={handleSensitiveToggle}
      />
    );
  } else {
    balanceSection = (
      <AggregatedBalance
        classPrefix={classPrefix}
        balanceIsCached={balanceIsCached}
        handleSensitiveToggle={handleSensitiveToggle}
      />
    );
  }

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
              {balanceSection}
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
