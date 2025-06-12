import { connect } from 'react-redux';
import {
  getOpenMetamaskTabsIds,
  requestAccountsAndChainPermissionsWithId,
  removePermissionsFor,
  removePermittedAccount,
} from '../../store/actions';
import {
  getConnectedSubjectsForSelectedAddress,
  getOriginOfCurrentTab,
  getPermissionSubjects,
  getPermittedAccountsByOrigin,
  getSelectedInternalAccount,
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
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[originOfCurrentTab]?.length;

  let tabToConnect;
  if (originOfCurrentTab && currentTabHasNoAccounts && !openMetaMaskTabs[id]) {
    tabToConnect = {
      origin: originOfCurrentTab,
    };
  }

  return {
    accountLabel: getSelectedInternalAccount(state).metadata.name,
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
    requestAccountsAndChainPermissionsWithId: (origin) =>
      dispatch(requestAccountsAndChainPermissionsWithId(origin)),
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
    requestAccountsAndChainPermissionsWithId,
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
      const id = await requestAccountsAndChainPermissionsWithId(
        tabToConnect.origin,
      );
      history.push(`${CONNECT_ROUTE}/${id}`);
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(ConnectedSites);
