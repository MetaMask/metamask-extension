import { connect } from 'react-redux';
import {
  getMetaMaskIdentities,
  getPermissionsDescriptions,
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;

  const allIdentities = getMetaMaskIdentities(state);
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  const permissionsDescriptions = getPermissionsDescriptions(state);

  return {
    allIdentitiesSelected,
    permissionsDescriptions,
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
