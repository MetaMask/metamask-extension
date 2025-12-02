import React, { useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import classnames from 'classnames';
import { CaipChainId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import { InternalAccount } from '@metamask/keyring-internal-api';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Box, ButtonLink, IconName } from '../../component-library';
import { TextVariant } from '../../../helpers/constants/design-system';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import { I18nContext } from '../../../contexts/i18n';
import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import {
  AddressListQueryParams,
  AddressListSource,
} from '../../../pages/multichain-accounts/multichain-account-address-list-page';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { trace, TraceName } from '../../../../shared/lib/trace';
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
  getIsMultichainAccountsState2Enabled,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../selectors';

import { PercentageAndAmountChange } from '../../multichain/token-list-item/price/percentage-and-amount-change/percentage-and-amount-change';
import { AccountGroupBalance } from '../assets/account-group-balance/account-group-balance';
import { AccountGroupBalanceChange } from '../assets/account-group-balance-change/account-group-balance-change';

import {
  getMultichainIsEvm,
  getMultichainShouldShowFiat,
  getMultichainIsTestnet,
} from '../../../selectors/multichain';
import { setPrivacyMode } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';

import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { AggregatedBalance } from '../../ui/aggregated-balance/aggregated-balance';
import { Skeleton } from '../../component-library/skeleton';
import { isZeroAmount } from '../../../helpers/utils/number-utils';
import { RewardsPointsBalance } from '../rewards/RewardsPointsBalance';
import { selectRewardsEnabled } from '../../../ducks/rewards/selectors';
import { BalanceEmptyState } from '../balance-empty-state';
import { selectAccountGroupBalanceForEmptyState } from '../../../selectors/assets';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
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

  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
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
    <Skeleton
      isLoading={
        !anyEnabledNetworksAreAvailable && isZeroAmount(balanceToDisplay)
      }
      marginBottom={1}
    >
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
        onClick={handleSensitiveToggle}
      />
    </Skeleton>
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
  const navigate = useNavigate();

  const { privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);

  const selectedAccountGroup = useSelector(getSelectedAccountGroup);

  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const isEvm = useSelector(getMultichainIsEvm);

  const tokensMarketData = useSelector(getTokensMarketData);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );
  const isRewardsEnabled = useSelector(selectRewardsEnabled);

  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const isTestnet = useSelector(getMultichainIsTestnet);

  const shouldShowBalanceEmptyState =
    isMultichainAccountsState2Enabled &&
    !isTestnet &&
    !balanceIsCached &&
    !hasBalance;

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

  const handleReceiveOnClick = useCallback(() => {
    trace({ name: TraceName.ReceiveModal });
    trackEvent({
      event: MetaMetricsEventName.NavReceiveButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        text: 'Receive',
        location: 'balance_empty_state',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
      },
    });

    if (isMultichainAccountsState2Enabled && selectedAccountGroup) {
      // Navigate to the multichain address list page with receive source
      navigate(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(selectedAccountGroup)}?${AddressListQueryParams.Source}=${AddressListSource.Receive}`,
      );
    }
  }, [
    isMultichainAccountsState2Enabled,
    selectedAccountGroup,
    navigate,
    trackEvent,
    chainId,
  ]);

  const renderPercentageAndAmountChange = () => {
    const renderPercentageAndAmountChangeTrail = () => {
      if (isRewardsEnabled) {
        return <RewardsPointsBalance />;
      }
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

    const renderNativeTokenView = () => {
      const value =
        tokensMarketData?.[getNativeTokenAddress(chainId as Hex)]
          ?.pricePercentChange1d;
      return (
        <Skeleton
          isLoading={!anyEnabledNetworksAreAvailable && isZeroAmount(value)}
        >
          <Box className="wallet-overview__currency-wrapper">
            <PercentageAndAmountChange value={value} />
            {renderPercentageAndAmountChangeTrail()}
          </Box>
        </Skeleton>
      );
    };

    const renderAggregatedView = () => (
      <Box className="wallet-overview__currency-wrapper">
        {isTokenNetworkFilterEqualCurrentNetwork ? (
          <AggregatedPercentageOverview
            trailingChild={renderPercentageAndAmountChangeTrail}
          />
        ) : (
          <AggregatedPercentageOverviewCrossChains
            trailingChild={renderPercentageAndAmountChangeTrail}
          />
        )}
      </Box>
    );

    const renderNonEvmView = () => (
      <Box className="wallet-overview__currency-wrapper">
        <AggregatedMultichainPercentageOverview
          privacyMode={privacyMode}
          trailingChild={renderPercentageAndAmountChangeTrail}
        />
      </Box>
    );

    // Early exit for state2 unified view
    if (isMultichainAccountsState2Enabled) {
      return (
        <Box className="wallet-overview__currency-wrapper">
          <AccountGroupBalanceChange
            period="1d"
            trailingChild={renderPercentageAndAmountChangeTrail}
          />
        </Box>
      );
    }

    if (!isEvm) {
      return renderNonEvmView();
    }

    return showNativeTokenAsMainBalance &&
      Object.keys(enabledNetworks).length === 1
      ? renderNativeTokenView()
      : renderAggregatedView();
  };

  let balanceSection: React.ReactNode;
  if (isMultichainAccountsState2Enabled) {
    balanceSection = (
      <AccountGroupBalance
        classPrefix={classPrefix}
        balanceIsCached={balanceIsCached}
        handleSensitiveToggle={handleSensitiveToggle}
        balance={balance}
        chainId={chainId}
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
        shouldShowBalanceEmptyState ? (
          <BalanceEmptyState
            className="w-full max-w-[460px] self-center"
            data-testid="coin-overview-balance-empty-state"
            onClickReceive={handleReceiveOnClick}
          />
        ) : (
          <Tooltip
            position="top"
            title={t('balanceOutdated')}
            disabled={!balanceIsCached}
          >
            <div
              className={`${classPrefix}-overview__balance [.wallet-overview-fullscreen_&]:items-center`}
            >
              <div className={`${classPrefix}-overview__primary-container`}>
                {balanceSection}
                {balanceIsCached && !shouldShowBalanceEmptyState && (
                  <span className={`${classPrefix}-overview__cached-star`}>
                    *
                  </span>
                )}
              </div>
              {!shouldShowBalanceEmptyState &&
                renderPercentageAndAmountChange()}
            </div>
          </Tooltip>
        )
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
