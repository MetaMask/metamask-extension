import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getOpenSeaEnabled, getUseNftDetection } from '../../../selectors';
import { setOpenSeaEnabled, setUseNftDetection } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const AutodetectNftsToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);
  const useNftDetection = useSelector(getUseNftDetection);

  return (
    <SettingsToggleItem
      title={t('useNftDetection')}
      description={t('useNftDetectionDescription')}
      value={useNftDetection}
      onToggle={(value) => {
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.NftDetected,
          properties: {
            action: MetaMetricsEventName.NftDetected,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            legacy_event: true,
          },
        });
        if (!value && !openSeaEnabled) {
          dispatch(setOpenSeaEnabled(true));
        }
        dispatch(setUseNftDetection(!value));
      }}
      dataTestId="use-nft-detection"
    />
  );
};
