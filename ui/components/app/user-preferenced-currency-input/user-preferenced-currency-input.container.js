import { connect } from 'react-redux';
import { toggleCurrencySwitch } from '../../../ducks/app/app';
import { getPreferences } from '../../../selectors';
import UserPreferencedCurrencyInput from './user-preferenced-currency-input.component';

const mapStateToProps = (state) => {
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);

  return {
    useNativeCurrencyAsPrimaryCurrency,
    sendInputCurrencySwitched: state.appState.sendInputCurrencySwitched,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onPreferenceToggle: () => dispatch(toggleCurrencySwitch()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserPreferencedCurrencyInput);
