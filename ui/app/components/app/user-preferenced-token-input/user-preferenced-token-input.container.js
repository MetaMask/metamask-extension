import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import UserPreferencedTokenInput from './user-preferenced-token-input.component'
import { getPreferences } from '../../../selectors'

const mapStateToProps = (state) => {
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state)

  return {
    useNativeCurrencyAsPrimaryCurrency,
  }
}

const UserPreferencedTokenInputContainer = connect(mapStateToProps)(UserPreferencedTokenInput)

UserPreferencedTokenInputContainer.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
}

export default UserPreferencedTokenInputContainer
