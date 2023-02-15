import { connect } from 'react-redux';
import {
  getMetaMaskIdentities,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  getPermissions,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities, request } = ownProps;
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  const currentPermissions = getPermissions(state, request.metadata.origin);
  ///: END:ONLY_INCLUDE_IN(flask)
  const allIdentities = getMetaMaskIdentities(state);
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    allIdentitiesSelected,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    currentPermissions,
    ///: END:ONLY_INCLUDE_IN
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
