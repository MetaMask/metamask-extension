import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUseTokenDetection } from '../../../selectors';
import { setUseTokenDetection } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const AutodetectTokensToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const useTokenDetection = useSelector(getUseTokenDetection);

  return (
    <SettingsToggleItem
      title={t('autoDetectTokens')}
      description={t('autoDetectTokensDescriptionV2')}
      value={useTokenDetection}
      onToggle={(value) => dispatch(setUseTokenDetection(!value))}
      dataTestId="autodetect-tokens"
    />
  );
};
