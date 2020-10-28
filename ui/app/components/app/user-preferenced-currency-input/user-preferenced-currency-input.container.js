import { connect } from 'react-redux'
import UserPreferencedCurrencyInput from './user-preferenced-currency-input.component'
// import { preferencesSelector } from '../../../selectors/selectors'

const mapStateToProps = (/* state */) => {
  // const { useNativeCurrencyAsPrimaryCurrency } = preferencesSelector(state)

  return {
    useNativeCurrencyAsPrimaryCurrency: true,
  }
}

export default connect(mapStateToProps)(UserPreferencedCurrencyInput)
