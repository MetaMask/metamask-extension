import { connect } from 'react-redux';
import {
  getMetaMaskAccounts,
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
  const allAccounts = getMetaMaskAccounts(state);
  const allAccountsSelected =
    Object.keys(selectedAccounts).length === Object.keys(allAccounts).length &&
    selectedAccounts.length > 1;

  return {
    allAccountsSelected,
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    currentPermissions,
    ///: END:ONLY_INCLUDE_IN
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
