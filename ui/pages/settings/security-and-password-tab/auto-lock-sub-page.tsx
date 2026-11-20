import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  ContentVariant,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ListItem,
} from '@metamask/design-system-react';
import { setAutoLockTimeLimit } from '../../../store/actions';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { transitionBack } from '../../../components/ui/transition';
import { useDispatch } from '../../../store/hooks';
import { AUTO_LOCK_OPTIONS } from './auto-lock-utils';

const AutoLockSubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT } =
    useSelector(getPreferences);

  const handleSelect = (value: number) => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SettingsUpdated)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          auto_lock_time_limit_minutes: value,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          previous_auto_lock_time_limit_minutes: autoLockTimeLimit,
        })
        .build(),
    );
    dispatch(setAutoLockTimeLimit(value));
    transitionBack(() => navigate(SECURITY_AND_PASSWORD_ROUTE));
  };

  return (
    <Box data-testid="auto-lock-options-list">
      {AUTO_LOCK_OPTIONS.map(({ labelKey, value }) => {
        const isSelected = autoLockTimeLimit === value;
        return (
          <ListItem
            key={value}
            variant={ContentVariant.OneLine}
            isInteractive
            onClick={() => handleSelect(value)}
            className={
              isSelected
                ? 'bg-muted hover:bg-muted-hover'
                : 'bg-background-default hover:bg-background-default-hover'
            }
            data-testid={`auto-lock-option-${value}`}
            title={t(labelKey)}
            endAccessory={
              isSelected ? (
                <Icon
                  name={IconName.Check}
                  size={IconSize.Md}
                  color={IconColor.IconDefault}
                />
              ) : undefined
            }
          />
        );
      })}
    </Box>
  );
};

export default AutoLockSubPage;
