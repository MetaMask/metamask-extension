import { connect } from 'react-redux'
import UserPreferencedTokenInput from './user-preferenced-token-input.component'
import { getPreferences } from '../../../selectors'

const mapStateToProps = (state) => {
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state)

  return {
    useNativeCurrencyAsPrimaryCurrency,
  }
}

export default connect(mapStateToProps)(UserPreferencedTokenInput)
