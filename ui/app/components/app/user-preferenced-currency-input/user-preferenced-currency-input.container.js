import { connect } from 'react-redux'
import UserPreferencedCurrencyInput from './user-preferenced-currency-input.component'
import { getPreferences } from '../../../selectors'

const mapStateToProps = (state) => {
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state)

  return {
    useNativeCurrencyAsPrimaryCurrency,
  }
}

export default connect(mapStateToProps)(UserPreferencedCurrencyInput)
