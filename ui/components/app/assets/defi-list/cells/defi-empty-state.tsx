import React, { FC, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTheme } from '../../../../../hooks/useTheme';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { getPortfolioUrl } from '../../../../../helpers/utils/portfolio';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import {
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../../../../selectors';

export const DeFiEmptyStateMessage: FC = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const handleExploreDefi = useCallback(() => {
    const url = getPortfolioUrl(
      'explore/tokens',
      'ext_defi_empty_state_button',
      metaMetricsId,
      isMetaMetricsEnabled,
      isMarketingEnabled,
    );
    global.platform.openTab({ url });
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.EmptyDeFiTabButtonClicked,
      properties: {
        location: 'DeFiTab',
        text: 'Explore DeFi',
      },
    });
  }, [isMarketingEnabled, isMetaMetricsEnabled, metaMetricsId, trackEvent]);

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
      className="mx-auto mt-4"
    />
  );
};
