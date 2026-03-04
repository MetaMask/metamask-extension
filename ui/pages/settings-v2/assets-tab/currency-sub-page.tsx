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
import availableCurrencies from '../../../helpers/constants/available-conversions.json';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { setCurrentCurrency } from '../../../store/actions';
import { ASSETS_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

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
  const { trackEvent } = useContext(MetaMetricsContext);
  const currentCurrency = useSelector(
    (state: { metamask: { currentCurrency?: string } }) =>
      state.metamask.currentCurrency?.toLowerCase() ?? 'usd',
  );

  const handleSelect = (value: string) => {
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.CurrentCurrency,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        current_currency: value,
        location: 'settings-page',
      },
    });
    dispatch(setCurrentCurrency(value));
    navigate(ASSETS_ROUTE);
  };

  return (
    <Box>
      {currencyOptions.map(({ value, label }) => {
        const isSelected = value.toLowerCase() === currentCurrency;
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
