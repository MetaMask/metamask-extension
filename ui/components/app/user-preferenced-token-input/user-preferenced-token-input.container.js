import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import UserPreferencedTokenInput from './user-preferenced-token-input.component';

const mapStateToProps = (state) => state;

const UserPreferencedTokenInputContainer = connect(mapStateToProps)(
  UserPreferencedTokenInput,
);

UserPreferencedTokenInputContainer.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
};

export default UserPreferencedTokenInputContainer;
