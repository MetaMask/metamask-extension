import React from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import availableCurrencies from '../../../helpers/constants/available-conversions.json';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { setCurrentCurrency } from '../../../store/actions';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { transitionBack } from '../../../components/ui/transition';

const sortedCurrencies = [...availableCurrencies].sort((a, b) =>
  a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()),
);

const currencyOptions = sortedCurrencies.map(({ code, name }) => ({
  value: code,
  label: `${code.toUpperCase()} - ${name}`,
}));

const CurrencySubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const currentCurrency = useSelector(getCurrentCurrency).toLowerCase();

  const handleSelect = (value: string) => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.CurrentCurrency)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          current_currency: value,
          location: 'settings-page',
        })
        .build(),
    );
    dispatch(setCurrentCurrency(value));
    transitionBack(() => navigate(PREFERENCES_AND_DISPLAY_ROUTE));
  };

  return (
    <Box
      data-testid="currency-select-list"
      className="h-full min-h-0 overflow-y-auto"
    >
      {currencyOptions.map(({ value, label }) => {
        const isSelected = value.toLowerCase() === currentCurrency;
        return (
          <Box
            key={value}
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

export default CurrencySubPage;
