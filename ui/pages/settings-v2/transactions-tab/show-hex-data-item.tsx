import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setFeatureFlag } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const ShowHexDataItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const sendHexData = useSelector(
    (state: { metamask?: { featureFlags?: { sendHexData?: boolean } } }) =>
      state.metamask?.featureFlags?.sendHexData ?? false,
  );

  return (
    <SettingsToggleItem
      title={t('showHexData')}
      description={t('showHexDataDescription')}
      value={sendHexData}
      onToggle={(value: boolean) =>
        dispatch(setFeatureFlag('sendHexData', !value, ''))
      }
      containerDataTestId="advanced-setting-hex-data"
      dataTestId="showHexData-toggle"
    />
  );
};
