import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { setAddSnapAccountEnabled } from '../../../store/actions';
import { getIsAddSnapAccountEnabled } from '../../../selectors';
import { SettingsToggleItem } from '../settings-toggle-item';

export type KeyringSnapsItemProps = {
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const KeyringSnapsItem = ({ sectionRef }: KeyringSnapsItemProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const value = useSelector(getIsAddSnapAccountEnabled);

  return (
    <SettingsToggleItem
      title={t('addSnapAccountToggle')}
      description={t('addSnapAccountsDescription')}
      value={value}
      onToggle={(newValue) => {
        trackEvent({
          event: MetaMetricsEventName.AddSnapAccountEnabled,
          category: MetaMetricsEventCategory.Settings,
          properties: { enabled: !newValue },
        });
        dispatch(setAddSnapAccountEnabled(!newValue));
      }}
      containerDataTestId="add-account-snap-toggle-div"
      dataTestId="add-account-snap-toggle-button"
      sectionRef={sectionRef}
    />
  );
};
