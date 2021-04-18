import { connect } from 'react-redux';
import { getPreferences } from '../../../selectors';
import UserPreferencedCurrencyInput from './user-preferenced-currency-input.component';

const mapStateToProps = (state) => {
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);

  return {
    useNativeCurrencyAsPrimaryCurrency,
  };
};

export default connect(mapStateToProps)(UserPreferencedCurrencyInput);
