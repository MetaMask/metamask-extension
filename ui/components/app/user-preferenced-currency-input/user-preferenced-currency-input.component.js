import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import CurrencyInput from '../currency-input';

export default class UserPreferencedCurrencyInput extends PureComponent {
  static propTypes = {
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
    sendInputCurrencySwitched: PropTypes.bool,
    ...CurrencyInput.propTypes,
  };

  render() {
    const {
      useNativeCurrencyAsPrimaryCurrency,
      sendInputCurrencySwitched,
      ...restProps
    } = this.props;

    return (
      <CurrencyInput
        {...restProps}
        isFiatPreferred={Boolean(
          (useNativeCurrencyAsPrimaryCurrency && sendInputCurrencySwitched) ||
            (!useNativeCurrencyAsPrimaryCurrency && !sendInputCurrencySwitched),
        )}
      />
    );
  }
}
