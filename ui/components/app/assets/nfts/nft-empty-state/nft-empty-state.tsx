import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getTheme,
  getIsEvmMultichainNetworkSelected,
} from '../../../../../selectors';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { IMPORT_NFTS_ROUTE } from '../../../../../helpers/constants/routes';

const EMPTY_STATE_CLASSNAME = 'mx-auto mt-5 mb-6 max-w-64';

const NftEmptyStateIcon = () => {
  const t = useI18nContext();
  const theme = useSelector(getTheme);

  const nftIcon =
    theme === ThemeType.dark
      ? './images/empty-state-nfts-dark.png'
      : './images/empty-state-nfts-light.png';

  return <img src={nftIcon} alt={t('nfts')} width={72} height={72} />;
};

export const NftUnsupportedEmptyState = () => {
  const t = useI18nContext();

  return (
    <TabEmptyState
      icon={<NftEmptyStateIcon />}
      description={t('nftUnsupportedEmptyDescription')}
      data-testid="nft-tab-unsupported-empty-state"
      className={EMPTY_STATE_CLASSNAME}
    />
  );
};

const NftDefaultEmptyState = () => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const navigate = useNavigate();

  const handleImportNfts = useCallback(() => {
    navigate(IMPORT_NFTS_ROUTE);
    trackEvent(
      createEventBuilder(MetaMetricsEventName.EmptyNFTTabButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'NFT_Empty_State',
        })
        .build(),
    );
  }, [createEventBuilder, navigate, trackEvent]);

  return (
    <TabEmptyState
      icon={<NftEmptyStateIcon />}
      description={t('nftEmptyDescription')}
      actionButtonText={t('importNFT')}
      onAction={handleImportNfts}
      data-testid="nft-tab-empty-state"
      className={EMPTY_STATE_CLASSNAME}
    />
  );
};

export const NftEmptyState = () => {
  const isEvmNetworkSelected = useSelector(getIsEvmMultichainNetworkSelected);

  if (!isEvmNetworkSelected) {
    return <NftUnsupportedEmptyState />;
  }

  return <NftDefaultEmptyState />;
};
