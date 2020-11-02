import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { getPreferences } from '../../../selectors'
import UserPreferencedTokenInput from './user-preferenced-token-input.component'

const mapStateToProps = (state) => {
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state)

  return {
    useNativeCurrencyAsPrimaryCurrency,
  }
}

const UserPreferencedTokenInputContainer = connect(mapStateToProps)(
  UserPreferencedTokenInput,
)

UserPreferencedTokenInputContainer.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
}

export default UserPreferencedTokenInputContainer
