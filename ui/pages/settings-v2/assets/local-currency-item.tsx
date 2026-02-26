import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconName,
  ButtonIcon,
  ButtonIconSize,
  TextColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SETTINGS_V2_CURRENCY_ROUTE } from '../settings-registry';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';

export const LocalCurrencyItem = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const currentCurrency = useSelector(getCurrentCurrency);

  const handleCurrencyPress = () => {
    navigate(SETTINGS_V2_CURRENCY_ROUTE);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      paddingVertical={3}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {t('localCurrency')}
      </Text>
      <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={1}>
        <Text color={TextColor.TextAlternative} variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {currentCurrency.toUpperCase()}
        </Text>
        <ButtonIcon
          iconName={IconName.ArrowRight}
          size={ButtonIconSize.Sm}
          className="text-icon-alternative"
          onClick={handleCurrencyPress}
          ariaLabel={t('localCurrency')}
        />
      </Box>
    </Box>
  );
};
