import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import UnitInput from '../unit-input';
import CurrencyDisplay from '../currency-display';
import {
  conversionUtil,
  getWeiHexFromDecimalValue,
  multiplyCurrencies,
} from '../../../../shared/modules/conversion.utils';

import { ETH } from '../../../helpers/constants/common';
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';

/**
 * Component that allows user to enter token values as a number, and props receive a converted
 * hex value. props.value, used as a default or forced value, should be a hex value, which
 * gets converted into a decimal value.
 */
export default class TokenInput extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    dataTestId: PropTypes.string,
    currentCurrency: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.string,
    showFiat: PropTypes.bool,
    hideConversion: PropTypes.bool,
    token: PropTypes.shape({
      address: PropTypes.string.isRequired,
      decimals: PropTypes.number,
      symbol: PropTypes.string,
    }).isRequired,
    tokenExchangeRates: PropTypes.object,
    tokens: PropTypes.array.isRequired,
  };

  constructor(props) {
    super(props);

    const { value: hexValue } = props;
    const decimalValue = hexValue ? this.getValue(props) : 0;

    this.state = {
      decimalValue,
      hexValue,
    };
  }

  componentDidUpdate(prevProps) {
    const { value: prevPropsHexValue } = prevProps;
    const { value: propsHexValue } = this.props;
    const { hexValue: stateHexValue } = this.state;

    if (
      prevPropsHexValue !== propsHexValue &&
      propsHexValue !== stateHexValue
    ) {
      const decimalValue = this.getValue(this.props);
      this.setState({ hexValue: propsHexValue, decimalValue });
    }
  }

  getValue(props) {
    const { value: hexValue, token: { decimals, symbol } = {} } = props;

    const multiplier = Math.pow(10, Number(decimals || 0));
    const decimalValueString = conversionUtil(addHexPrefix(hexValue), {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      toCurrency: symbol,
      conversionRate: multiplier,
      invertConversionRate: true,
    });

    return Number(decimalValueString) ? decimalValueString : '';
  }

  handleChange = (decimalValue, applyDecimals = false) => {
    const { token: { decimals } = {}, onChange } = this.props;

    let newDecimalValue = decimalValue;

    if (decimals && decimalValue && applyDecimals) {
      newDecimalValue = new BigNumber(decimalValue, 10).toFixed(decimals);
    }

    const multiplier = Math.pow(10, Number(decimals || 0));
    const hexValue = multiplyCurrencies(newDecimalValue || 0, multiplier, {
      multiplicandBase: 10,
      multiplierBase: 10,
      toNumericBase: 'hex',
    });

    this.setState({ hexValue, decimalValue });
    onChange(hexValue);
  };

  handleBlur = (decimalValue) => {
    this.handleChange(decimalValue, true);
  };

  renderConversionComponent() {
    const {
      tokenExchangeRates,
      showFiat,
      currentCurrency,
      hideConversion,
      token,
      tokens,
    } = this.props;
    const { decimalValue } = this.state;

    const existingToken = tokens.find(({ address }) =>
      isEqualCaseInsensitive(address, token.address),
    );

    const tokenExchangeRate = tokenExchangeRates?.[existingToken?.address] ?? 0;
    let currency, numberOfDecimals;

    if (hideConversion) {
      return (
        <div className="currency-input__conversion-component">
          {this.context.t('noConversionRateAvailable')}
        </div>
      );
    }

    if (showFiat) {
      // Display Fiat
      currency = currentCurrency;
      numberOfDecimals = 2;
    } else {
      // Display ETH
      currency = ETH;
      numberOfDecimals = 6;
    }

    const decimalEthValue = decimalValue * tokenExchangeRate || 0;
    const hexWeiValue = getWeiHexFromDecimalValue({
      value: decimalEthValue,
      fromCurrency: ETH,
      fromDenomination: ETH,
    });

    return tokenExchangeRate ? (
      <CurrencyDisplay
        className="currency-input__conversion-component"
        currency={currency}
        value={hexWeiValue}
        numberOfDecimals={numberOfDecimals}
      />
    ) : (
      <div className="currency-input__conversion-component">
        {this.context.t('noConversionRateAvailable')}
      </div>
    );
  }

  render() {
    const { token, ...restProps } = this.props;
    const { decimalValue } = this.state;

    return (
      <UnitInput
        {...restProps}
        suffix={token.symbol}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        value={decimalValue}
      >
        {this.renderConversionComponent()}
      </UnitInput>
    );
  }
}
