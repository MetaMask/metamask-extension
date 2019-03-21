import { connect } from 'react-redux'
import UserPreferencedTokenInput from './user-preferenced-token-input.component'
import { preferencesSelector } from '../../../selectors/selectors'

const mapStateToProps = state => {
  const { useNativeCurrencyAsPrimaryCurrency } = preferencesSelector(state)

  return {
    useNativeCurrencyAsPrimaryCurrency,
  }
}

export default connect(mapStateToProps)(UserPreferencedTokenInput)
