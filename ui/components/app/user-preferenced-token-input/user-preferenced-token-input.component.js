import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TokenInput from '../../ui/token-input';
import { getTokenSymbol } from '../../../store/actions';

// This component is not used in codebase, removing usage of useNativeCurrencyAsPrimaryCurrency in this PR
export default class UserPreferencedTokenInput extends PureComponent {
  static propTypes = {
    token: PropTypes.shape({
      address: PropTypes.string.isRequired,
      decimals: PropTypes.number,
      symbol: PropTypes.string,
    }).isRequired,
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
    const { ...restProps } = this.props;

    return (
      <TokenInput {...restProps} showFiat={this.state.isOriginalTokenSymbol} />
    );
  }
}
