import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@metamask/design-system-react';
import { MenuItem } from '../../ui/menu';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import {
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { IconName } from '../../component-library';

export const DiscoverMenuItem = ({
  closeMenu,
  metricsLocation,
}: {
  closeMenu: () => void;
  metricsLocation: string;
}) => {
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

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
        location: metricsLocation,
        text: 'Portfolio',
      },
    });
    closeMenu();
  }, [
    closeMenu,
    isMarketingEnabled,
    isMetaMetricsEnabled,
    metaMetricsId,
    trackEvent,
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
