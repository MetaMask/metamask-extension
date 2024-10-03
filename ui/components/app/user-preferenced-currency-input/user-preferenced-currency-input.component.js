import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import CurrencyInput from '../currency-input';

// Noticed this component is not used in codebase;
// removing usage of useNativeCurrencyAsPrimaryCurrency because its being removed in this PR
export default class UserPreferencedCurrencyInput extends PureComponent {
  static propTypes = {
    sendInputCurrencySwitched: PropTypes.bool,
    ...CurrencyInput.propTypes,
  };

  render() {
    const { sendInputCurrencySwitched, ...restProps } = this.props;

    return (
      <CurrencyInput
        {...restProps}
        isFiatPreferred={Boolean(sendInputCurrencySwitched)}
      />
    );
  }
}
