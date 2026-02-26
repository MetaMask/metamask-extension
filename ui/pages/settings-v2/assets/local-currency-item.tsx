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
  Icon,
  IconName,
  IconSize,
  IconColor,
  Button,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import availableCurrencies from '../../../helpers/constants/available-conversions.json';
import { SETTINGS_V2_CURRENCY_ROUTE } from '../settings-registry';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';

const sortedCurrencies = [...availableCurrencies].sort((a, b) =>
  a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()),
);

const getCurrencyDisplayLabel = (code: string): string => {
  const found = sortedCurrencies.find(
    (c) => c.code.toLowerCase() === code?.toLowerCase(),
  );
  if (!found) {
    return code ? code.toUpperCase() : '';
  }
  return `${found.code.toUpperCase()} - ${found.name}`;
};

export const LocalCurrencyItem = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const currentCurrency = useSelector(getCurrentCurrency);
  const displayLabel = getCurrencyDisplayLabel(currentCurrency ?? 'usd');

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
      <Button
        onClick={handleCurrencyPress}
        variant={ButtonVariant.Tertiary}
        data-testid="local-currency-button"
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {displayLabel}
        </Text>
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.IconAlternative}
        />
      </Button>
    </Box>
  );
};
