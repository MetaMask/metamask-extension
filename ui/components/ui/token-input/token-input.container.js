import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  getIsMainnet,
  getTokenExchangeRates,
  getPreferences,
} from '../../../selectors';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import TokenInput from './token-input.component';

const mapStateToProps = (state) => {
  const {
    metamask: { currentCurrency },
  } = state;
  const {
    showFiatInTestnets,
    useNativeCurrencyAsPrimaryCurrency,
  } = getPreferences(state);
  const isMainnet = getIsMainnet(state);
  const conversionRate = getConversionRate(state);
  const showFiat = !useNativeCurrencyAsPrimaryCurrency && showFiatInTestnets;

  return {
    currentCurrency,
    tokenExchangeRates: getTokenExchangeRates(state),
    hideConversion: (!isMainnet && !showFiatInTestnets) || !conversionRate,
    showFiat,
  };
};

const TokenInputContainer = connect(mapStateToProps)(TokenInput);

TokenInputContainer.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
};

export default TokenInputContainer;
