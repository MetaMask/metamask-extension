import { connect } from 'react-redux';
import {
  getOpenMetamaskTabsIds,
  requestAccountsPermissionWithId,
  removePermissionsFor,
  removePermittedAccount,
} from '../../store/actions';
import {
  getConnectedSubjectsForSelectedAddress,
  getCurrentAccountWithSendEtherInfo,
  getOriginOfCurrentTab,
  getPermissionSubjects,
  getPermittedAccountsByOrigin,
  getSelectedAddress,
} from '../../selectors';
import { CONNECT_ROUTE } from '../../helpers/constants/routes';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import ConnectedSites from './connected-sites.component';

const mapStateToProps = (state) => {
  const { openMetaMaskTabs } = state.appState;
  const { id } = state.activeTab;
  const connectedSubjects = getConnectedSubjectsForSelectedAddress(state);
  const originOfCurrentTab = getOriginOfCurrentTab(state);
  const permittedAccountsByOrigin = getPermittedAccountsByOrigin(state);
  const selectedAddress = getSelectedAddress(state);

  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[originOfCurrentTab]?.length;

  let tabToConnect;
  if (originOfCurrentTab && currentTabHasNoAccounts && !openMetaMaskTabs[id]) {
    tabToConnect = {
      origin: originOfCurrentTab,
    };
  }

  return {
    accountLabel: getCurrentAccountWithSendEtherInfo(state).name,
    connectedSubjects,
    subjects: getPermissionSubjects(state),
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    permittedAccountsByOrigin,
    selectedAddress,
    tabToConnect,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    getOpenMetamaskTabsIds: () => dispatch(getOpenMetamaskTabsIds()),
    disconnectAccount: (subjectKey, address) => {
      dispatch(removePermittedAccount(subjectKey, address));
    },
    disconnectAllAccounts: (subjectKey, subject) => {
      const permissionMethodNames = Object.values(subject.permissions).map(
        ({ parentCapability }) => parentCapability,
      );
      dispatch(
        removePermissionsFor({
          [subjectKey]: permissionMethodNames,
        }),
      );
    },
    requestAccountsPermissionWithId: (origin) =>
      dispatch(requestAccountsPermissionWithId(origin)),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    connectedSubjects,
    subjects,
    mostRecentOverviewPage,
    selectedAddress,
    tabToConnect,
  } = stateProps;
  const {
    disconnectAccount,
    disconnectAllAccounts,
    // eslint-disable-next-line no-shadow
    requestAccountsPermissionWithId,
  } = dispatchProps;
  const { history } = ownProps;

  const closePopover = () => history.push(mostRecentOverviewPage);

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    closePopover,
    disconnectAccount: (subjectKey) => {
      disconnectAccount(subjectKey, selectedAddress);
      if (connectedSubjects.length === 1) {
        closePopover();
      }
    },
    disconnectAllAccounts: (subjectKey) => {
      disconnectAllAccounts(subjectKey, subjects[subjectKey]);
      if (connectedSubjects.length === 1) {
        closePopover();
      }
    },
    requestAccountsPermission: async () => {
      const id = await requestAccountsPermissionWithId(tabToConnect.origin);
      history.push(`${CONNECT_ROUTE}/${id}`);
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(ConnectedSites);
