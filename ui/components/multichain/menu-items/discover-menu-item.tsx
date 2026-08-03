import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Box, IconName } from '@metamask/design-system-react';
import { MenuItem } from '../../ui/menu';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  getDataCollectionForMarketing,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export const DiscoverMenuItem = ({
  closeMenu,
  metricsLocation,
}: {
  closeMenu: () => void;
  metricsLocation: string;
}) => {
  const analyticsId = useSelector(getAnalyticsId);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const t = useI18nContext();

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
          location: metricsLocation,
          text: 'Portfolio',
        })
        .build(),
    );
    closeMenu();
  }, [
    closeMenu,
    isMarketingEnabled,
    isMetaMetricsEnabled,
    analyticsId,
    metricsLocation,
    trackEvent,
    createEventBuilder,
  ]);

  return (
    <MenuItem
      iconName={IconName.Export}
      onClick={() => handlePortfolioOnClick()}
      data-testid="portfolio-menu-item"
    >
      <Box className="flex flex-row items-center justify-between">
        {t('discover')}
      </Box>
    </MenuItem>
  );
};
