import React from 'react';
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
import { AUTO_LOCK_OPTIONS } from './auto-lock-utils';

const AutoLockSubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT } =
    useSelector(getPreferences);

  const handleSelect = (value: number) => {
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
