import { connect } from 'react-redux';
import {
  getInternalAccounts,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  getPermissions,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedAccounts } = ownProps;
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  const currentPermissions = getPermissions(
    state,
    ownProps.request.metadata?.origin,
  );
  ///: END:ONLY_INCLUDE_IN
  const allInternalAccounts = getInternalAccounts(state);
  const allInternalAccountsSelected =
    Object.keys(selectedAccounts).length ===
      Object.keys(allInternalAccounts).length && selectedAccounts.length > 1;

  return {
    allInternalAccountsSelected,
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    currentPermissions,
    ///: END:ONLY_INCLUDE_IN
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
