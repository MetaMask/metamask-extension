import React, { useContext, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { twMerge } from '@metamask/design-system-react';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getTheme } from '../../../../../selectors';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { showImportNftsModal } from '../../../../../store/actions';

export type NftEmptyStateProps = {
  className?: string;
};

export const NftEmptyState = ({ className }: NftEmptyStateProps) => {
  const t = useI18nContext();
  const theme = useSelector(getTheme);
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  // Theme-aware icon
  const nftIcon =
    theme === ThemeType.dark
      ? './images/empty-state-nfts-dark.png'
      : './images/empty-state-nfts-light.png';

  const handleImportNfts = useCallback(() => {
    dispatch(showImportNftsModal({}));
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.EmptyNFTTabButtonClicked,
      properties: {
        location: 'NFT_Empty_State',
      },
    });
  }, [dispatch, trackEvent]);

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
