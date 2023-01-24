import { SubjectType } from '@metamask/subject-metadata-controller';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  getAccountsWithLabels,
  getLastConnectedInfo,
  getPermissionsRequests,
  getSelectedAddress,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  getSnapInstallOrUpdateRequests,
  ///: END:ONLY_INCLUDE_IN
  getTargetSubjectMetadata,
} from '../../selectors';
import { getNativeCurrency } from '../../ducks/metamask/metamask';

import { formatDate, getURLHostName } from '../../helpers/utils/util';
import {
  approvePermissionsRequest,
  rejectPermissionsRequest,
  showModal,
  getCurrentWindowTab,
  getRequestAccountTabIds,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  resolvePendingApproval,
  rejectPendingApproval,
  ///: END:ONLY_INCLUDE_IN
} from '../../store/actions';
import {
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  CONNECT_SNAP_INSTALL_ROUTE,
  CONNECT_SNAP_UPDATE_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../helpers/constants/routes';
import PermissionApproval from './permissions-connect.component';

const mapStateToProps = (state, ownProps) => {
  const {
    match: {
      params: { id: permissionsRequestId },
    },
    location: { pathname },
  } = ownProps;
  let permissionsRequests = getPermissionsRequests(state);
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  permissionsRequests = [
    ...permissionsRequests,
    ...getSnapInstallOrUpdateRequests(state),
  ];
  ///: END:ONLY_INCLUDE_IN
  const currentAddress = getSelectedAddress(state);

  const permissionsRequest = permissionsRequests.find(
    (req) => req.metadata.id === permissionsRequestId,
  );

  const isRequestingAccounts = Boolean(
    permissionsRequest?.permissions?.eth_accounts,
  );

  const { metadata = {} } = permissionsRequest || {};
  const { origin } = metadata;
  const nativeCurrency = getNativeCurrency(state);

  const targetSubjectMetadata = getTargetSubjectMetadata(state, origin) ?? {
    name: getURLHostName(origin) || origin,
    origin,
    iconUrl: null,
    extensionId: null,
    subjectType: SubjectType.Unknown,
  };

  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  const isSnap = targetSubjectMetadata.subjectType === SubjectType.Snap;
  ///: END:ONLY_INCLUDE_IN

  const accountsWithLabels = getAccountsWithLabels(state);

  const lastConnectedInfo = getLastConnectedInfo(state) || {};
  const addressLastConnectedMap = lastConnectedInfo[origin]?.accounts || {};

  Object.keys(addressLastConnectedMap).forEach((key) => {
    addressLastConnectedMap[key] = formatDate(
      addressLastConnectedMap[key],
      'yyyy-MM-dd',
    );
  });

  const connectPath = `${CONNECT_ROUTE}/${permissionsRequestId}`;
  const confirmPermissionPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`;
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  const snapInstallPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_INSTALL_ROUTE}`;
  const snapUpdatePath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_UPDATE_ROUTE}`;
  ///: END:ONLY_INCLUDE_IN

  let totalPages = 1 + isRequestingAccounts;
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  totalPages += isSnap;
  ///: END:ONLY_INCLUDE_IN
  totalPages = totalPages.toString();

  let page = '';
  if (pathname === connectPath) {
    page = '1';
  } else if (pathname === confirmPermissionPath) {
    page = isRequestingAccounts ? '2' : '1';
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
  } else if (pathname === snapInstallPath || pathname === snapUpdatePath) {
    page = isRequestingAccounts ? '3' : '2';
    ///: END:ONLY_INCLUDE_IN
  } else {
    throw new Error('Incorrect path for permissions-connect component');
  }

  return {
    isRequestingAccounts,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    isSnap,
    snapInstallPath,
    snapUpdatePath,
    ///: END:ONLY_INCLUDE_IN
    permissionsRequest,
    permissionsRequestId,
    accounts: accountsWithLabels,
    currentAddress,
    origin,
    newAccountNumber: accountsWithLabels.length + 1,
    nativeCurrency,
    addressLastConnectedMap,
    lastConnectedInfo,
    connectPath,
    confirmPermissionPath,
    totalPages,
    page,
    targetSubjectMetadata,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    approvePermissionsRequest: (request) =>
      dispatch(approvePermissionsRequest(request)),
    rejectPermissionsRequest: (requestId) =>
      dispatch(rejectPermissionsRequest(requestId)),
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    approvePendingApproval: (id, value) =>
      dispatch(resolvePendingApproval(id, value)),
    rejectPendingApproval: (id, error) =>
      dispatch(rejectPendingApproval(id, error)),
    ///: END:ONLY_INCLUDE_IN
    showNewAccountModal: ({ onCreateNewAccount, newAccountNumber }) => {
      return dispatch(
        showModal({
          name: 'NEW_ACCOUNT',
          onCreateNewAccount,
          newAccountNumber,
        }),
      );
    },
    getRequestAccountTabIds: () => dispatch(getRequestAccountTabIds()),
    getCurrentWindowTab: () => dispatch(getCurrentWindowTab()),
  };
};

const PermissionApprovalContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PermissionApproval);

PermissionApprovalContainer.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default PermissionApprovalContainer;
