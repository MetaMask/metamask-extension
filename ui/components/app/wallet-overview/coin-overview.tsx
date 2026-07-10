import React, { useContext, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import classnames from 'clsx';
import { CaipChainId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import { InternalAccount } from '@metamask/keyring-internal-api';
import { Box, Skeleton } from '@metamask/design-system-react';
import { ButtonLink, IconName } from '../../component-library';
import { TextVariant } from '../../../helpers/constants/design-system';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import { I18nContext } from '../../../contexts/i18n';
import { getMultichainAccountAddressListReceivePagePath } from '../../../pages/multichain-accounts/multichain-account-address-list-page';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { trace, TraceName } from '../../../../shared/lib/trace';
import {
  getShouldHideZeroBalanceTokens,
  getIsTestnet,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getChainIdsToPoll,
  getDataCollectionForMarketing,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
  getEnabledNetworksByNamespace,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../selectors';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';

import { AccountGroupBalance } from '../assets/account-group-balance/account-group-balance';
import { AccountGroupBalanceChange } from '../assets/account-group-balance-change/account-group-balance-change';

import {
  getMultichainShouldShowFiat,
  getMultichainIsTestnet,
} from '../../../selectors/multichain';
import { setPrivacyMode } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';

import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { useRewardsModal } from '../../../hooks/rewards/useRewardsModal';
import { isZeroAmount } from '../../../helpers/utils/number-utils';
import { BalanceEmptyState } from '../balance-empty-state';
import { selectAccountGroupBalanceForEmptyState } from '../../../selectors/assets';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
import { useAccountGroupBalanceDisplay } from '../assets/account-group-balance-change/useAccountGroupBalanceDisplay';
import WalletOverview from './wallet-overview';
import CoinButtons from './coin-buttons';

export type CoinOverviewProps = {
  account: InternalAccount;
  balance: string;
  balanceIsCached: boolean;
  className?: string;
  classPrefix?: string;
  chainId: CaipChainId | Hex;
  isBridgeChain: boolean;
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

  const showNativeTokenAsMain = useMemo(
    () =>
      showNativeTokenAsMainBalance && Object.keys(enabledNetworks).length === 1,
    [showNativeTokenAsMainBalance, enabledNetworks],
  );

  const isNotAggregatedFiatBalance = useMemo(
    () => !shouldShowFiat || showNativeTokenAsMain || isTestnet,
    [shouldShowFiat, showNativeTokenAsMain, isTestnet],
  );

  const balanceToDisplay = useMemo(
    () => (isNotAggregatedFiatBalance ? balance : totalFiatBalance),
    [isNotAggregatedFiatBalance, balance, totalFiatBalance],
  );

  const currencyDisplayType = useMemo((): typeof PRIMARY | typeof SECONDARY => {
    const isMultiNetwork = Object.keys(enabledNetworks).length > 1;
    if (isMultiNetwork && showNativeTokenAsMainBalance) {
      return SECONDARY;
    }
    return PRIMARY;
  }, [enabledNetworks, showNativeTokenAsMainBalance]);

  return (
    <Skeleton
      hideChildren={
        !anyEnabledNetworksAreAvailable && isZeroAmount(balanceToDisplay)
      }
      className="mb-1"
    >
      <UserPreferencedCurrencyDisplay
        style={{ display: 'contents' }}
        account={account}
        className={classnames(`${classPrefix}-overview__primary-balance`, {
          [`${classPrefix}-overview__cached-balance`]: balanceIsCached,
        })}
        data-testid={`${classPrefix}-overview__primary-currency`}
        value={balanceToDisplay}
        type={currencyDisplayType}
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
  isSwapsChain,
  isSigningEnabled,
}: CoinOverviewProps) => {
  const t: ReturnType<typeof useI18nContext> = useContext(I18nContext);

  const { trackEvent, createEventBuilder } = useAnalytics();

  const analyticsId = useSelector(getAnalyticsId);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled = useMemo(
    () => completedMetaMetricsOnboarding && isOptedIn,
    [completedMetaMetricsOnboarding, isOptedIn],
  );
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { privacyMode } = useSelector(getPreferences);

  const selectedAccountGroup = useSelector(getSelectedAccountGroup);

  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const isTestnet = useSelector(getMultichainIsTestnet);

  const period = '1d';
  const { isLoading: balanceIsLoading } = useAccountGroupBalanceDisplay(period);

  useRewardsModal();

  const shouldShowBalanceEmptyState = useMemo(
    () =>
      Boolean(selectedAccountGroup) &&
      !isTestnet &&
      !balanceIsCached &&
      !hasBalance &&
      !balanceIsLoading,
    [
      selectedAccountGroup,
      isTestnet,
      balanceIsCached,
      hasBalance,
      balanceIsLoading,
    ],
  );

  const handleSensitiveToggle = useCallback(() => {
    dispatch(setPrivacyMode(!privacyMode));
  }, [dispatch, privacyMode]);

  const handlePortfolioOnClick = useCallback(() => {
    const url = getPortfolioUrl(
      'explore/tokens',
      'ext_portfolio_button',
      analyticsId,
      isMetaMetricsEnabled === true,
      isMarketingEnabled === true,
    );
    global.platform.openTab({ url });
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PortfolioLinkClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'Home',
          text: 'Portfolio',
        })
        .build(),
    );
  }, [isMarketingEnabled, isMetaMetricsEnabled, analyticsId, trackEvent]);

  const handleReceiveOnClick = useCallback(() => {
    trace({ name: TraceName.ReceiveModal });
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NavReceiveButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          text: 'Receive',
          location: 'balance_empty_state',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
        })
        .build(),
    );

    if (selectedAccountGroup) {
      // Navigate to the multichain address list page with receive source
      navigate(
        getMultichainAccountAddressListReceivePagePath(selectedAccountGroup),
      );
    }
  }, [selectedAccountGroup, navigate, trackEvent, chainId]);

  const renderPercentageAndAmountChange = () => {
    const renderPercentageAndAmountChangeTrail = () => {
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

    return (
      <Box className="wallet-overview__currency-wrapper">
        <AccountGroupBalanceChange
          period={period}
          trailingChild={renderPercentageAndAmountChangeTrail}
        />
      </Box>
    );
  };

  const balanceSection: React.ReactNode = (
    <AccountGroupBalance
      classPrefix={classPrefix}
      balanceIsCached={balanceIsCached}
      handleSensitiveToggle={handleSensitiveToggle}
      balance={balance}
      chainId={chainId}
    />
  );

  return (
    <WalletOverview
      // @ts-expect-error: React 18 ReactElement.key is Key|null, incompatible with @types/prop-types ReactNodeLike
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
      // @ts-expect-error: React 18 ReactElement.key is Key|null, incompatible with @types/prop-types ReactNodeLike
      buttons={
        <CoinButtons
          {...{
            account,
            trackingLocation: 'home',
            chainId,
            isSwapsChain,
            isSigningEnabled,
            isBridgeChain,
            classPrefix,
          }}
        />
      }
      className={className}
    />
  );
};
