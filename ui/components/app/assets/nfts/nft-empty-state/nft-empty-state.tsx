import React, { useContext, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getTheme,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getDataCollectionForMarketing,
} from '../../../../../selectors';
import { getPortfolioUrl } from '../../../../../helpers/utils/portfolio';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';

export type NftEmptyStateProps = {
  className?: string;
};

export const NftEmptyState = ({ className }: NftEmptyStateProps) => {
  const t = useI18nContext();
  const theme = useSelector(getTheme);
  const trackEvent = useContext(MetaMetricsContext);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  // Theme-aware icon
  const nftIcon =
    theme === ThemeType.dark
      ? './images/empty-state-nfts-dark.png'
      : './images/empty-state-nfts-light.png';

  const handleDiscoverNfts = useCallback(() => {
    const url = getPortfolioUrl(
      'explore/nfts',
      'ext_nft_empty_state_button',
      metaMetricsId,
      isMetaMetricsEnabled,
      isMarketingEnabled,
    );
    global.platform.openTab({ url });
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.EmptyNFTTabButtonClicked,
      properties: {
        location: 'NFT_Empty_State',
      },
    });
  }, [metaMetricsId, isMetaMetricsEnabled, isMarketingEnabled, trackEvent]);

  return (
    <TabEmptyState
      icon={<img src={nftIcon} alt={t('nfts')} width={72} height={72} />}
      description={t('nftEmptyDescription')}
      actionButtonText={t('discoverNFTs')}
      onAction={handleDiscoverNfts}
      data-testid="nft-tab-empty-state"
      className={className}
    />
  );
};
