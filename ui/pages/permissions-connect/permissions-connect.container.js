import { SubjectType } from '@metamask/subject-metadata-controller';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/rpc-methods';
///: END:ONLY_INCLUDE_IN
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  getAccountsWithLabels,
  getLastConnectedInfo,
  getPermissionsRequests,
  getSelectedAddress,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  getSnapInstallOrUpdateRequests,
  getRequestState,
  getSnapsInstallPrivacyWarningShown,
  ///: END:ONLY_INCLUDE_IN
  getRequestType,
  getTargetSubjectMetadata,
} from '../../selectors';
import { getNativeCurrency } from '../../ducks/metamask/metamask';

import { formatDate, getURLHostName } from '../../helpers/utils/util';
import {
  approvePermissionsRequest,
  rejectPermissionsRequest,
  showModal,
  getRequestAccountTabIds,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  resolvePendingApproval,
  rejectPendingApproval,
  setSnapsInstallPrivacyWarningShownStatus,
  ///: END:ONLY_INCLUDE_IN
} from '../../store/actions';
import {
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  CONNECT_SNAPS_CONNECT_ROUTE,
  CONNECT_SNAP_INSTALL_ROUTE,
  CONNECT_SNAP_UPDATE_ROUTE,
  CONNECT_SNAP_RESULT_ROUTE,
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
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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

  let requestType = getRequestType(state, permissionsRequestId);

  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  // We want to only assign the wallet_connectSnaps request type (i.e. only show
  // SnapsConnect) if and only if we get a singular wallet_snap permission request.
  // Any other request gets pushed to the normal permission connect flow.
  if (
    permissionsRequest &&
    Object.keys(permissionsRequest.permissions || {}).length === 1 &&
    permissionsRequest.permissions?.[WALLET_SNAP_PERMISSION_KEY]
  ) {
    requestType = 'wallet_connectSnaps';
  }

  const requestState = getRequestState(state, permissionsRequestId) || {};
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
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  const snapsConnectPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAPS_CONNECT_ROUTE}`;
  const snapInstallPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_INSTALL_ROUTE}`;
  const snapUpdatePath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_UPDATE_ROUTE}`;
  const snapResultPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_RESULT_ROUTE}`;
  const isSnapInstallOrUpdateOrResult =
    pathname === snapInstallPath ||
    pathname === snapUpdatePath ||
    pathname === snapResultPath;
  ///: END:ONLY_INCLUDE_IN

  let totalPages = 1 + isRequestingAccounts;
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  totalPages += isSnapInstallOrUpdateOrResult;
  ///: END:ONLY_INCLUDE_IN
  totalPages = totalPages.toString();

  let page = '';
  if (pathname === connectPath) {
    page = '1';
  } else if (pathname === confirmPermissionPath) {
    page = isRequestingAccounts ? '2' : '1';
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  } else if (isSnapInstallOrUpdateOrResult) {
    page = isRequestingAccounts ? '3' : '2';
  } else if (pathname === snapsConnectPath) {
    page = 1;
    ///: END:ONLY_INCLUDE_IN
  } else {
    throw new Error('Incorrect path for permissions-connect component');
  }

  return {
    isRequestingAccounts,
    requestType,
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    snapsConnectPath,
    snapInstallPath,
    snapUpdatePath,
    snapResultPath,
    requestState,
    hideTopBar: isSnapInstallOrUpdateOrResult,
    snapsInstallPrivacyWarningShown: getSnapsInstallPrivacyWarningShown(state),
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
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    approvePendingApproval: (id, value) =>
      dispatch(resolvePendingApproval(id, value)),
    rejectPendingApproval: (id, error) =>
      dispatch(rejectPendingApproval(id, error)),
    setSnapsInstallPrivacyWarningShownStatus: (shown) => {
      dispatch(setSnapsInstallPrivacyWarningShownStatus(shown));
    },
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
