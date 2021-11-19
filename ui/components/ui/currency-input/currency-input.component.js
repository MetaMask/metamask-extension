import React, { PureComponent, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UnitInput from '../unit-input';
import CurrencyDisplay from '../currency-display';
import {
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
} from '../../../helpers/utils/conversions.util';
import { ETH } from '../../../helpers/constants/common';
import { I18nContext } from '../../../contexts/i18n';
import { useDispatch } from 'react-redux';
// import { toggleCurrencySwitch } from '../../../ducks/app/app';

/**
 * Component that allows user to enter currency values as a number, and props receive a converted
 * hex value in WEI. props.value, used as a default or forced value, should be a hex value, which
 * gets converted into a decimal value depending on the currency (ETH or Fiat).
 */
 export default function CurrencyInput ({
  hexValue,           // value !
  preferredCurrency,  // nativeCurrency !
  secondaryCurrency,  // currentCurrency !
  hideSecondary,      // hideFiat !
  featureSecondary,   // useFiat !
  conversionRate,     // conversionRate !
  primarySuffix,      // nativeSuffix !
  secondarySuffix,    // fiatSuffix !
  onChange,
  onPreferenceToggle,
  }) {

  const t = useContext(I18nContext);

  // const dispatch = useDispatch();

  const [isSwapped, setSwapped] = useState(false);
  const [hexValueNew, setHexValueNew] = useState('');
  const [decimalValue, setDecimalValue] = useState(0);

  useEffect(() => {
    const decimalValueString = shouldUseFiat()
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
      setHexValueNew(hexValue)
      setDecimalValue(Number(decimalValueString));
  }, [hexValue]);

  // const getDecimalValue = () => {
  //   const decimalValueString = shouldUseFiat()
  //     ? getValueFromWeiHex({
  //         value: hexValue,
  //         toCurrency: secondaryCurrency,
  //         conversionRate,
  //         numberOfDecimals: 2,
  //       })
  //     : getValueFromWeiHex({
  //         value: hexValue,
  //         toCurrency: ETH,
  //         numberOfDecimals: 8,
  //       });

  //   return Number(decimalValueString) || 0;
  // }

  const shouldUseFiat = () => {
    if (hideSecondary) {
      return false;
    }

    if (preferredCurrency === ETH && featureSecondary === true) {
      return true;
    } else if (preferredCurrency === ETH && featureSecondary === false) {
      return false;
    }

    if (isSwapped) {
      return true
    }
  };
  const swap = () => {
    
      
    
    // dispatch(toggleCurrencySwitch(!isSwapped))
    onPreferenceToggle(!isSwapped);
    setSwapped(!isSwapped);
    handleChange(decimalValue);

  };


  const handleChange = (decimalValue) => {console.log("decimalValue", decimalValue)
    const hexValue = shouldUseFiat()
      ? getWeiHexFromDecimalValue({
          value: decimalValue,
          fromCurrency: secondaryCurrency,
          conversionRate,
          invertConversionRate: true,
        })
      : getWeiHexFromDecimalValue({
          value: decimalValue,
          fromCurrency: ETH,
          fromDenomination: ETH,
          conversionRate,
        });
        console.log(hexValue)
      setHexValueNew(hexValue);
      setDecimalValue(decimalValue);
      onChange(hexValue);
  };

  const renderConversionComponent = () => {
    let currency, numberOfDecimals;

    if (hideSecondary) {
      return (
        <div className="currency-input__conversion-component">
          {t('noConversionRateAvailable')}
        </div>
      );
    }

    if (shouldUseFiat()) {
      // Display ETH
      currency = preferredCurrency || ETH;
      numberOfDecimals = 8;
    } else {
      // Display Fiat
      currency = secondaryCurrency;
      numberOfDecimals = 2;
    }
    console.log()
    return (
      <CurrencyDisplay
        className="currency-input__conversion-component"
        currency={currency}
        value={hexValueNew}
        numberOfDecimals={numberOfDecimals}
      />
    );
  }

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
      suffix={shouldUseFiat() ? secondarySuffix : primarySuffix}
      onChange={handleChange}
      value={decimalValue}
      actionComponent={
        <div className="currency-input__swap-component" onClick={swap} />
      }
    >
      {renderConversionComponent()}
    </UnitInput>
  );
}

CurrencyInput.propTypes = {
  hexValue: PropTypes.string,
  preferredCurrency: PropTypes.string,
  secondaryCurrency: PropTypes.string,
  hideSecondary: PropTypes.bool,
  featureSecondary: PropTypes.bool,
  conversionRate: PropTypes.number,
  primarySuffix: PropTypes.string,
  secondarySuffix: PropTypes.string,
  onChange: PropTypes.func,
  onPreferenceToggle: PropTypes.func,
};
