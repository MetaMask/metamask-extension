import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTheme } from '../../../../../hooks/useTheme';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { getPortfolioUrl } from '../../../../../helpers/utils/portfolio';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import {
  getDataCollectionForMarketing,
  getAnalyticsId,
  getConsentDecisionMade,
  getOptedIn,
  getIsEvmMultichainNetworkSelected,
} from '../../../../../selectors';

const EMPTY_STATE_CLASSNAME = 'mx-auto mt-5 mb-6 max-w-48';

const DeFiEmptyStateIcon = () => {
  const t = useI18nContext();
  const theme = useTheme();

  const defiIcon =
    theme === ThemeType.dark
      ? '/images/empty-state-defi-dark.png'
      : '/images/empty-state-defi-light.png';

  return <img src={defiIcon} alt={t('defi')} width={72} height={72} />;
};

export const DeFiUnsupportedEmptyStateMessage = () => {
  const t = useI18nContext();

  return (
    <TabEmptyState
      icon={<DeFiEmptyStateIcon />}
      description={t('defiUnsupportedEmptyDescription')}
      data-testid="defi-tab-unsupported-empty-state"
      className={EMPTY_STATE_CLASSNAME}
    />
  );
};

const DeFiDefaultEmptyStateMessage = () => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const analyticsId = useSelector(getAnalyticsId);
  const consentDecisionMade = useSelector(getConsentDecisionMade);
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled = consentDecisionMade && isOptedIn;
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const handleExploreDefi = useCallback(() => {
    const url = getPortfolioUrl(
      'explore/tokens',
      'ext_defi_empty_state_button',
      analyticsId,
      isMetaMetricsEnabled === true,
      isMarketingEnabled === true,
    );
    global.platform.openTab({ url });
    trackEvent(
      createEventBuilder(MetaMetricsEventName.EmptyDeFiTabButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'DeFiTab',
          text: 'Explore DeFi',
        })
        .build(),
    );
  }, [
    analyticsId,
    createEventBuilder,
    isMarketingEnabled,
    isMetaMetricsEnabled,
    trackEvent,
  ]);

  return (
    <TabEmptyState
      icon={<DeFiEmptyStateIcon />}
      description={t('defiEmptyDescription')}
      actionButtonText={t('exploreDefi')}
      onAction={handleExploreDefi}
      data-testid="defi-tab-empty-state"
      className={EMPTY_STATE_CLASSNAME}
    />
  );
};

export const DeFiEmptyStateMessage = () => {
  const isEvmNetworkSelected = useSelector(getIsEvmMultichainNetworkSelected);

  if (!isEvmNetworkSelected) {
    return <DeFiUnsupportedEmptyStateMessage />;
  }

  return <DeFiDefaultEmptyStateMessage />;
};
