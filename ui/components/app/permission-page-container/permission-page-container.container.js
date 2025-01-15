import { connect } from 'react-redux';
import {
  getInternalAccounts,
  getPermissions,
  selectPendingApprovalsForOrigin,
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedAccounts } = ownProps;
  const origin = ownProps.request.metadata?.origin;
  const currentPermissions = getPermissions(state, origin);
  const allInternalAccounts = getInternalAccounts(state);
  const originPendingApprovals = selectPendingApprovalsForOrigin(state, origin);

  const allInternalAccountsSelected =
    Object.keys(selectedAccounts).length ===
      Object.keys(allInternalAccounts).length && selectedAccounts.length > 1;

  return {
    allInternalAccountsSelected,
    currentPermissions,
    originPendingApprovals,
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
