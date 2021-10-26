import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import CurrencyInput from '../../ui/currency-input';

export default class UserPreferencedCurrencyInput extends PureComponent {
  static propTypes = {
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
    passDataToSendAmount: PropTypes.func,
    location: PropTypes.object
  };

  state = {
    dataFromCurrency: {}
  }

  getDataFromCurrency = (value) => {
    this.setState({ dataFromCurrency: value })
  }

  render() {
    const { useNativeCurrencyAsPrimaryCurrency, location, ...restProps } = this.props;
    
    this.props.passDataToSendAmount(this.state)

    return (
      <CurrencyInput
        {...restProps}
        useFiat={!useNativeCurrencyAsPrimaryCurrency}
        passDataToUserPeference={this.getDataFromCurrency}
        location={location}
      />
    );
  }
}
