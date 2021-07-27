import { connect } from 'react-redux';
import { ETH } from '../../../helpers/constants/common';
import { getShouldShowFiat } from '../../../selectors';
import CurrencyInput from './currency-input.component';

const mapStateToProps = (state) => {
  const {
    metamask: { nativeCurrency, currentCurrency, conversionRate },
  } = state;
  const showFiat = getShouldShowFiat(state);

  return {
    nativeCurrency,
    currentCurrency,
    conversionRate,
    hideFiat: !showFiat,
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { nativeCurrency, currentCurrency } = stateProps;

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    nativeSuffix: nativeCurrency || ETH,
    fiatSuffix: currentCurrency.toUpperCase(),
  };
};

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput);
