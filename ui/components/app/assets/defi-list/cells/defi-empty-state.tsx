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
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
} from '../../../../../selectors';

export const DeFiEmptyStateMessage = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const analyticsId = useSelector(getAnalyticsId);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;
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

  const defiIcon =
    theme === ThemeType.dark
      ? '/images/empty-state-defi-dark.png'
      : '/images/empty-state-defi-light.png';

  return (
    <TabEmptyState
      icon={<img src={defiIcon} alt={t('defi')} width={72} height={72} />}
      description={t('defiEmptyDescription')}
      actionButtonText={t('exploreDefi')}
      onAction={handleExploreDefi}
      data-testid="defi-tab-empty-state"
      className="mx-auto mt-5 mb-6 max-w-48"
    />
  );
};
