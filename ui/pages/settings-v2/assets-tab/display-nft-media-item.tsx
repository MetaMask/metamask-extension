import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getOpenSeaEnabled, getUseNftDetection } from '../../../selectors';
import { setOpenSeaEnabled, setUseNftDetection } from '../../../store/actions';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const DisplayNftMediaToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);
  const useNftDetection = useSelector(getUseNftDetection);

  return (
    <SettingsToggleItem
      title={t('displayNftMedia')}
      description={t('displayNftMediaDescriptionV2')}
      value={openSeaEnabled}
      onToggle={(value) => {
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: 'Enabled/Disable OpenSea',
          properties: {
            action: 'Enabled/Disable OpenSea',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            legacy_event: true,
          },
        });
        if (value && useNftDetection) {
          dispatch(setUseNftDetection(false));
        }
        dispatch(setOpenSeaEnabled(!value));
      }}
      dataTestId="display-nft-media"
    />
  );
};
