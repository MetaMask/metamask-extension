import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { twMerge } from '@metamask/design-system-react';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getTheme } from '../../../../../selectors';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { showImportNftsModal } from '../../../../../store/actions';
import { useAppDispatch } from '../../../../../store/hooks';

export type NftEmptyStateProps = {
  className?: string;
};

export const NftEmptyState = ({ className }: NftEmptyStateProps) => {
  const t = useI18nContext();
  const theme = useSelector(getTheme);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const dispatch = useAppDispatch();

  // Theme-aware icon
  const nftIcon =
    theme === ThemeType.dark
      ? './images/empty-state-nfts-dark.png'
      : './images/empty-state-nfts-light.png';

  const handleImportNfts = useCallback(() => {
    dispatch(showImportNftsModal({}));
    trackEvent(
      createEventBuilder(MetaMetricsEventName.EmptyNFTTabButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'NFT_Empty_State',
        })
        .build(),
    );
  }, [createEventBuilder, dispatch, trackEvent]);

  return (
    <TabEmptyState
      icon={<img src={nftIcon} alt={t('nfts')} width={72} height={72} />}
      description={t('nftEmptyDescription')}
      actionButtonText={t('importNFT')}
      onAction={handleImportNfts}
      data-testid="nft-tab-empty-state"
      className={twMerge('max-w-64', className)}
    />
  );
};
