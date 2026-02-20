import { connect } from 'react-redux';
import { TOGGLE_CURRENCY_INPUT_SWITCH } from '../../../store/actionConstants';
import UserPreferencedCurrencyInput from './user-preferenced-currency-input.component';

const mapStateToProps = (state) => {
  return {
    sendInputCurrencySwitched: state.appState.sendInputCurrencySwitched,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onPreferenceToggle: () =>
      dispatch({
        type: TOGGLE_CURRENCY_INPUT_SWITCH,
      }),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserPreferencedCurrencyInput);
