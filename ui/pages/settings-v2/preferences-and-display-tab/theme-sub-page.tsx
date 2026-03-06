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
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { setTheme } from '../../../store/actions';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import { getTheme } from '../../../selectors';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useI18nContext } from '../../../hooks/useI18nContext';

const themeOptions: { value: ThemeType; labelKey: string }[] = [
  { value: ThemeType.light, labelKey: 'lightTheme' },
  { value: ThemeType.dark, labelKey: 'darkTheme' },
  { value: ThemeType.os, labelKey: 'osTheme' },
];

const ThemeSubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const currentTheme = useSelector(getTheme) as ThemeType;

  const handleSelect = (value: ThemeType) => {
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.ThemeChanged,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        theme_selected: value,
      },
    });
    dispatch(setTheme(value));
    navigate(PREFERENCES_AND_DISPLAY_ROUTE);
  };

  return (
    <Box>
      {themeOptions.map(({ value, labelKey }) => {
        const isSelected = value === currentTheme;
        return (
          <Box
            key={value}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            backgroundColor={
              isSelected
                ? BoxBackgroundColor.BackgroundMuted
                : BoxBackgroundColor.BackgroundDefault
            }
            className="w-full cursor-pointer border-0 p-4"
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

export default ThemeSubPage;
