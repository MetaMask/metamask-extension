import { connect } from 'react-redux'
import UserPreferencedTokenInput from './user-preferenced-token-input.component'
import { preferencesSelector } from '../../selectors'

const mapStateToProps = state => {
  const { useETHAsPrimaryCurrency } = preferencesSelector(state)

  return {
    useETHAsPrimaryCurrency,
  }
}

export default connect(mapStateToProps)(UserPreferencedTokenInput)
