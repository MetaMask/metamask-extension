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
    preferredCurrency: nativeCurrency,
    secondaryCurrency: currentCurrency,
    conversionRate,
    hideSecondary: !showFiat,
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { preferredCurrency, secondaryCurrency } = stateProps;

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    primarySuffix: preferredCurrency || ETH,
    secondarySuffix: secondaryCurrency.toUpperCase(),
  };
};

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput);
