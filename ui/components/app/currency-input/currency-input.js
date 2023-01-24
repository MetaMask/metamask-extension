import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import UnitInput from '../../ui/unit-input';
import CurrencyDisplay from '../../ui/currency-display';
import { ETH } from '../../../helpers/constants/common';
import { I18nContext } from '../../../contexts/i18n';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../../ducks/metamask/metamask';
import { getCurrentCurrency, getShouldShowFiat } from '../../../selectors';
import {
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
} from '../../../../shared/modules/conversion.utils';

/**
 * Component that allows user to enter currency values as a number, and props receive a converted
 * hex value in WEI. props.value, used as a default or forced value, should be a hex value, which
 * gets converted into a decimal value depending on the currency (ETH or Fiat).
 *
 * @param options0
 * @param options0.hexValue
 * @param options0.featureSecondary
 * @param options0.onChange
 * @param options0.onPreferenceToggle
 */
export default function CurrencyInput({
  hexValue,
  featureSecondary,
  onChange,
  onPreferenceToggle,
}) {
  const t = useContext(I18nContext);

  const preferredCurrency = useSelector(getNativeCurrency);
  const secondaryCurrency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);
  const showFiat = useSelector(getShouldShowFiat);
  const hideSecondary = !showFiat;
  const primarySuffix = preferredCurrency || ETH;
  const secondarySuffix = secondaryCurrency.toUpperCase();

  const [isSwapped, setSwapped] = useState(false);
  const [newHexValue, setNewHexValue] = useState(hexValue);
  const [shouldDisplayFiat, setShouldDisplayFiat] = useState(featureSecondary);
  const shouldUseFiat = hideSecondary ? false : Boolean(shouldDisplayFiat);

  const getDecimalValue = () => {
    const decimalValueString = shouldUseFiat
      ? getValueFromWeiHex({
          value: hexValue,
          toCurrency: secondaryCurrency,
          conversionRate,
          numberOfDecimals: 2,
        })
      : getValueFromWeiHex({
          value: hexValue,
          toCurrency: ETH,
          numberOfDecimals: 8,
        });

    return Number(decimalValueString) || 0;
  };

  const initialDecimalValue = hexValue ? getDecimalValue() : 0;

  const swap = async () => {
    await onPreferenceToggle();
    setSwapped(!isSwapped);
    setShouldDisplayFiat(!shouldDisplayFiat);
  };

  const handleChange = (newDecimalValue) => {
    const hexValueNew = shouldUseFiat
      ? getWeiHexFromDecimalValue({
          value: newDecimalValue,
          fromCurrency: secondaryCurrency,
          conversionRate,
          invertConversionRate: true,
        })
      : getWeiHexFromDecimalValue({
          value: newDecimalValue,
          fromCurrency: ETH,
          fromDenomination: ETH,
          conversionRate,
        });

    setNewHexValue(hexValueNew);
    onChange(hexValueNew);
    setSwapped(!isSwapped);
  };

  useEffect(() => {
    setNewHexValue(hexValue);
  }, [hexValue]);

  useEffect(() => {
    if (featureSecondary) {
      handleChange(initialDecimalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureSecondary, initialDecimalValue]);

  const renderConversionComponent = () => {
    let currency, numberOfDecimals;

    if (hideSecondary) {
      return (
        <div className="currency-input__conversion-component">
          {t('noConversionRateAvailable')}
        </div>
      );
    }

    if (shouldUseFiat) {
      // Display ETH
      currency = preferredCurrency || ETH;
      numberOfDecimals = 8;
    } else {
      // Display Fiat
      currency = secondaryCurrency;
      numberOfDecimals = 2;
    }

    return (
      <CurrencyDisplay
        className="currency-input__conversion-component"
        currency={currency}
        value={newHexValue}
        numberOfDecimals={numberOfDecimals}
      />
    );
  };

  return (
    <UnitInput
      {...{
        hexValue,
        preferredCurrency,
        secondaryCurrency,
        hideSecondary,
        featureSecondary,
        conversionRate,
        onChange,
        onPreferenceToggle,
      }}
      dataTestId="currency-input"
      suffix={shouldUseFiat ? secondarySuffix : primarySuffix}
      onChange={handleChange}
      value={initialDecimalValue}
      actionComponent={
        <button
          className="currency-input__swap-component"
          data-testid="currency-swap"
          onClick={swap}
        >
          <i className="fa fa-retweet fa-lg" />
        </button>
      }
    >
      {renderConversionComponent()}
    </UnitInput>
  );
}

CurrencyInput.propTypes = {
  hexValue: PropTypes.string,
  featureSecondary: PropTypes.bool,
  onChange: PropTypes.func,
  onPreferenceToggle: PropTypes.func,
};
