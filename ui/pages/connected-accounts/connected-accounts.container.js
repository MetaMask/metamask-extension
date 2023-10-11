import { connect } from 'react-redux';
import {
  getAccountToConnectToActiveTab,
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getPermissionsForActiveTab,
  getPermissionSubjects,
  getSelectedAddress,
  getSubjectMetadata,
} from '../../selectors';
import { isExtensionUrl } from '../../helpers/utils/util';
import {
  addPermittedAccount,
  removePermittedAccount,
  setSelectedAddress,
} from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import ConnectedAccounts from './connected-accounts.component';

const mapStateToProps = (state) => {
  const { activeTab } = state;
  const accountToConnect = getAccountToConnectToActiveTab(state);
  const connectedAccounts = getOrderedConnectedAccountsForActiveTab(state);
  const permissions = getPermissionsForActiveTab(state);
  const selectedAddress = getSelectedAddress(state);
  const subjectMetadata = getSubjectMetadata(state);
  const originOfActiveTab = getOriginOfCurrentTab(state);
  const permissionSubjects = getPermissionSubjects(state);

  const isActiveTabExtension = isExtensionUrl(activeTab);
  return {
    accountToConnect,
    isActiveTabExtension,
    activeTabOrigin: activeTab.origin,
    connectedAccounts,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    permissions,
    selectedAddress,
    subjectMetadata,
    originOfActiveTab,
    permissionSubjects,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addPermittedAccount: (origin, address) =>
      dispatch(addPermittedAccount(origin, address)),
    removePermittedAccount: (origin, address) =>
      dispatch(removePermittedAccount(origin, address)),
    setSelectedAddress: (address) => dispatch(setSelectedAddress(address)),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { activeTabOrigin } = stateProps;

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    connectAccount: (address) =>
      dispatchProps.addPermittedAccount(activeTabOrigin, address),
    removePermittedAccount: (address) =>
      dispatchProps.removePermittedAccount(activeTabOrigin, address),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(ConnectedAccounts);
