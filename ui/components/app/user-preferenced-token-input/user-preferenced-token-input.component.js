import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TokenInput from '../../ui/token-input';
import { getTokenSymbol } from '../../../store/actions';

export default class UserPreferencedTokenInput extends PureComponent {
  static propTypes = {
    token: PropTypes.shape({
      address: PropTypes.string.isRequired,
      decimals: PropTypes.number,
      symbol: PropTypes.string,
    }).isRequired,
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
  };

  state = {
    isOriginalTokenSymbol: true,
  };

  componentDidMount() {
    const {
      token: { address, symbol },
    } = this.props;

    getTokenSymbol(address).then((symbolToMatch) => {
      this.setState({ isOriginalTokenSymbol: symbolToMatch === symbol });
    });
  }

  render() {
    const { useNativeCurrencyAsPrimaryCurrency, ...restProps } = this.props;

    return (
      <TokenInput
        {...restProps}
        showFiat={
          !useNativeCurrencyAsPrimaryCurrency &&
          this.state.isOriginalTokenSymbol
        }
      />
    );
  }
}
