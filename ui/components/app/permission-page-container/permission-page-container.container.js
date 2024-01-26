import { connect } from 'react-redux';
import {
  getInternalAccounts,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  getPermissions,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedAccounts } = ownProps;
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  const currentPermissions = getPermissions(
    state,
    ownProps.request.metadata?.origin,
  );
  ///: END:ONLY_INCLUDE_IF
  const allInternalAccounts = getInternalAccounts(state);
  const allInternalAccountsSelected =
    Object.keys(selectedAccounts).length ===
      Object.keys(allInternalAccounts).length && selectedAccounts.length > 1;

  return {
    allInternalAccountsSelected,
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    currentPermissions,
    ///: END:ONLY_INCLUDE_IF
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
