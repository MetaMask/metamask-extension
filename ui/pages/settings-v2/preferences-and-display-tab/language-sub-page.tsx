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
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import { updateCurrentLocale } from '../../../store/actions';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import type { MetaMaskReduxState } from '../../../store/store';

const localeOptions = locales.map(({ code, name }) => ({
  value: code,
  label: name,
}));

const LanguageSubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentLocale = useSelector(
    (state: MetaMaskReduxState) => state.metamask.currentLocale,
  );

  const handleSelect = (value: string) => {
    dispatch(updateCurrentLocale(value));
    navigate(PREFERENCES_AND_DISPLAY_ROUTE);
  };

  return (
    <Box data-testid="locale-select-list">
      {localeOptions.map(({ value, label }) => {
        const isSelected = value === currentLocale;
        return (
          <Box
            key={value}
            data-testid={`locale-option-${value}`}
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
              {label}
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

export default LanguageSubPage;
