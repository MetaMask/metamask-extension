import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setUseExternalNameSources } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const ProposedNicknamesItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const useExternalNameSources = useSelector(
    (state: { metamask?: { useExternalNameSources?: boolean } }) =>
      state.metamask?.useExternalNameSources,
  );

  return (
    <SettingsToggleItem
      title={t('externalNameSourcesSetting')}
      description={t('externalNameSourcesSettingDescription')}
      value={Boolean(useExternalNameSources)}
      onToggle={(value: boolean) => dispatch(setUseExternalNameSources(!value))}
      containerDataTestId="useExternalNameSources"
      dataTestId="useExternalNameSources-toggle"
    />
  );
};
