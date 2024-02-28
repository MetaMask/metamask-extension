import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import UnitInput from '../../ui/unit-input';
import CurrencyDisplay from '../../ui/currency-display';
import { I18nContext } from '../../../contexts/i18n';
import {
  getConversionRate,
  getNativeCurrency,
  getProviderConfig,
} from '../../../ducks/metamask/metamask';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getShouldShowFiat,
} from '../../../selectors';
import {
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
} from '../../../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../../../shared/constants/common';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';

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
 * @param options0.swapIcon
 * @param options0.isLongSymbol
 * @param options0.className
 * @param options0.tokenSymbol
 */
export default function CurrencyInput({
  hexValue,
  featureSecondary,
  onChange,
  onPreferenceToggle,
  swapIcon,
  isLongSymbol = false,
  className = '',
  tokenSymbol,
}) {
  const t = useContext(I18nContext);

  const preferredCurrency = useSelector(getNativeCurrency);
  const secondaryCurrency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);
  const showFiat = useSelector(getShouldShowFiat);
  const chainId = useSelector(getCurrentChainId);
  const { ticker, type } = useSelector(getProviderConfig);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
  );
  const hideSecondary = !showFiat;
  const primarySuffix =
    tokenSymbol || preferredCurrency || EtherDenomination.ETH;
  const secondarySuffix = secondaryCurrency.toUpperCase();

  const [newHexValue, setNewHexValue] = useState(hexValue);
  const [shouldDisplayFiat, setShouldDisplayFiat] = useState(featureSecondary);
  const shouldUseFiat = hideSecondary ? false : Boolean(shouldDisplayFiat);

  const isPrimary = !shouldUseFiat;

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
          toCurrency: EtherDenomination.ETH,
          numberOfDecimals: 8,
        });

    return Number(decimalValueString) || 0;
  };

  const initialDecimalValue = hexValue ? getDecimalValue() : 0;

  const swap = async () => {
    await onPreferenceToggle();
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
          fromCurrency: EtherDenomination.ETH,
          fromDenomination: EtherDenomination.ETH,
          conversionRate,
        });

    setNewHexValue(hexValueNew);
    onChange(hexValueNew);
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

  const renderSwapButton = () => {
    if (!isOriginalNativeSymbol) {
      return null;
    }
    return (
      <button
        className="currency-input__swap-component"
        data-testid="currency-swap"
        onClick={swap}
      >
        <i className="fa fa-retweet fa-lg" />
      </button>
    );
  };
  const renderConversionComponent = () => {
    let currency, numberOfDecimals, suffix;

    if (hideSecondary) {
      return (
        <div className="currency-input__conversion-component">
          {t('noConversionRateAvailable')}
        </div>
      );
    }
    if (!isOriginalNativeSymbol) {
      return null;
    }

    if (shouldUseFiat) {
      // Display ETH
      currency = preferredCurrency || EtherDenomination.ETH;
      suffix = primarySuffix;
      numberOfDecimals = 8;
    } else {
      // Display Fiat
      currency = isOriginalNativeSymbol ? secondaryCurrency : null;
      numberOfDecimals = 2;
    }

    return (
      <CurrencyDisplay
        // hides the fiat suffix
        hideLabel={isLongSymbol}
        suffix={suffix}
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
      hideSuffix={isPrimary && isLongSymbol}
      dataTestId="currency-input"
      suffix={isPrimary ? primarySuffix : secondarySuffix}
      onChange={handleChange}
      value={initialDecimalValue}
      className={className}
      actionComponent={swapIcon ? swapIcon(swap) : renderSwapButton()}
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
  swapIcon: PropTypes.func,
  isLongSymbol: PropTypes.bool,
  className: PropTypes.string,
  tokenSymbol: PropTypes.string,
};
