///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
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
import { ExperimentalTabItem } from './experimental-tab-item';

export type KeyringSnapsItemProps = {
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const KeyringSnapsItem = ({ sectionRef }: KeyringSnapsItemProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const toggleValue = useSelector(getIsAddSnapAccountEnabled);

  return (
    <ExperimentalTabItem
      title={t('addSnapAccountToggle')}
      description={t('addSnapAccountsDescription')}
      toggleValue={toggleValue}
      toggleCallback={(value) => {
        trackEvent({
          event: MetaMetricsEventName.AddSnapAccountEnabled,
          category: MetaMetricsEventCategory.Settings,
          properties: { enabled: !value },
        });
        dispatch(setAddSnapAccountEnabled(!value));
      }}
      toggleDataTestId="add-account-snap-toggle-button"
      sectionRef={sectionRef}
    />
  );
};
///: END:ONLY_INCLUDE_IF
