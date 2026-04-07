import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { setAutoLockTimeLimit } from '../../../store/actions';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { getPreferences } from '../../../selectors';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { AUTO_LOCK_OPTIONS } from './auto-lock-utils';

const AutoLockSubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT } =
    useSelector(getPreferences);

  const handleSelect = (value: number) => {
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        auto_lock_time_limit_minutes: value,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        previous_auto_lock_time_limit_minutes: autoLockTimeLimit,
      },
    });
    dispatch(setAutoLockTimeLimit(value));
    navigate(SECURITY_AND_PASSWORD_ROUTE);
  };

  return (
    <Box data-testid="auto-lock-options-list">
      {AUTO_LOCK_OPTIONS.map(({ labelKey, value }) => {
        const isSelected = autoLockTimeLimit === value;
        return (
          <Box
            key={value}
            data-testid={`auto-lock-option-${value}`}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            className={`w-full cursor-pointer border-0 p-4 ${
              isSelected
                ? 'bg-muted hover:bg-muted-hover'
                : 'bg-background-default hover:bg-background-default-hover'
            }`}
            onClick={() => handleSelect(value)}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t(labelKey)}
            </Text>
            {isSelected && (
              <Icon
                name={IconName.Check}
                size={IconSize.Md}
                color={IconColor.IconDefault}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default AutoLockSubPage;
