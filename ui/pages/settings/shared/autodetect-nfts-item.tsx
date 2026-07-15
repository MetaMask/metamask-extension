import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getOpenSeaEnabled, getUseNftDetection } from '../../../selectors';
import { setOpenSeaEnabled, setUseNftDetection } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { ASSET_ITEMS } from '../search-config';
import { useAppDispatch } from '../../../store/hooks';
import { SettingsToggleItem } from './settings-toggle-item';

export const AutodetectNftsToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useAppDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const openSeaEnabled = useSelector(getOpenSeaEnabled);
  const useNftDetection = useSelector(getUseNftDetection);

  return (
    <SettingsToggleItem
      title={t(ASSET_ITEMS['autodetect-nfts'])}
      description={t('useNftDetectionDescription')}
      value={useNftDetection}
      onToggle={(value) => {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.NftDetected)
            .addCategory(MetaMetricsEventCategory.Settings)
            .addProperties({
              action: MetaMetricsEventName.NftDetected,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              legacy_event: true,
            })
            .build(),
        );
        if (!value && !openSeaEnabled) {
          dispatch(setOpenSeaEnabled(true));
        }
        dispatch(setUseNftDetection(!value));
      }}
      dataTestId="use-nft-detection-input"
      containerDataTestId="use-nft-detection"
    />
  );
};
