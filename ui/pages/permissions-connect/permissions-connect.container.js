import { SubjectType } from '@metamask/permission-controller';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-rpc-methods';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isEvmAccountType } from '@metamask/keyring-api';
import { Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';
import {
  getAccountsWithLabels,
  getLastConnectedInfo,
  getPermissionsRequests,
  getSelectedInternalAccount,
  getSnapInstallOrUpdateRequests,
  getRequestState,
  getSnapsInstallPrivacyWarningShown,
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
  resolvePendingApproval,
  rejectPendingApproval,
  setSnapsInstallPrivacyWarningShownStatus,
} from '../../store/actions';
import {
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  CONNECT_SNAPS_CONNECT_ROUTE,
  CONNECT_SNAP_INSTALL_ROUTE,
  CONNECT_SNAP_UPDATE_ROUTE,
  CONNECT_SNAP_RESULT_ROUTE,
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
  permissionsRequests = [
    ...permissionsRequests,
    ...getSnapInstallOrUpdateRequests(state),
  ];
  const { address: currentAddress } = getSelectedInternalAccount(state);

  const permissionsRequest = permissionsRequests.find(
    (req) => req.metadata.id === permissionsRequestId,
  );

  const { metadata = {}, diff = {} } = permissionsRequest || {};
  const { origin } = metadata;
  const nativeCurrency = getNativeCurrency(state);

  const isRequestApprovalPermittedChains = Boolean(diff?.permissionDiffMap);
  const isRequestingAccounts = Boolean(
    permissionsRequest?.permissions?.[Caip25EndowmentPermissionName] &&
      !isRequestApprovalPermittedChains,
  );

  const targetSubjectMetadata = getTargetSubjectMetadata(state, origin) ?? {
    name: getURLHostName(origin) || origin,
    origin,
    iconUrl: null,
    extensionId: null,
    subjectType: SubjectType.Unknown,
  };

  let requestType = getRequestType(state, permissionsRequestId);

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

  // We only consider EVM accounts.
  // Connections with non-EVM accounts (Bitcoin only for now) are used implicitly and handled by the Bitcoin Snap itself.
  const accountsWithLabels = getAccountsWithLabels(state).filter((account) =>
    isEvmAccountType(account.type),
  );

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
  const snapsConnectPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAPS_CONNECT_ROUTE}`;
  const snapInstallPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_INSTALL_ROUTE}`;
  const snapUpdatePath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_UPDATE_ROUTE}`;
  const snapResultPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_RESULT_ROUTE}`;
  const isSnapInstallOrUpdateOrResult =
    pathname === snapInstallPath ||
    pathname === snapUpdatePath ||
    pathname === snapResultPath;

  let totalPages = 1 + isRequestingAccounts;
  totalPages += isSnapInstallOrUpdateOrResult;
  totalPages = totalPages.toString();

  let page = '';
  if (pathname === connectPath) {
    page = '1';
  } else if (pathname === confirmPermissionPath) {
    page = isRequestingAccounts ? '2' : '1';
  } else if (isSnapInstallOrUpdateOrResult) {
    page = isRequestingAccounts ? '3' : '2';
  } else if (pathname === snapsConnectPath) {
    page = 1;
  } else {
    throw new Error('Incorrect path for permissions-connect component');
  }

  return {
    isRequestingAccounts,
    requestType,
    snapsConnectPath,
    snapInstallPath,
    snapUpdatePath,
    snapResultPath,
    requestState,
    hideTopBar: isSnapInstallOrUpdateOrResult,
    snapsInstallPrivacyWarningShown: getSnapsInstallPrivacyWarningShown(state),
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
    approvePendingApproval: (id, value) =>
      dispatch(resolvePendingApproval(id, value)),
    rejectPendingApproval: (id, error) =>
      dispatch(rejectPendingApproval(id, error)),
    setSnapsInstallPrivacyWarningShownStatus: (shown) => {
      dispatch(setSnapsInstallPrivacyWarningShownStatus(shown));
    },
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
