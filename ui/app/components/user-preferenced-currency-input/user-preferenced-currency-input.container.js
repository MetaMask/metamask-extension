import { connect } from 'react-redux'
import UserPreferencedCurrencyInput from './user-preferenced-currency-input.component'
import { preferencesSelector } from '../../selectors'

const mapStateToProps = state => {
  const { useETHAsPrimaryCurrency } = preferencesSelector(state)

  return {
    useETHAsPrimaryCurrency,
  }
}

export default connect(mapStateToProps)(UserPreferencedCurrencyInput)
