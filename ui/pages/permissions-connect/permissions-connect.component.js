import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom-v5-compat';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { SubjectType } from '@metamask/permission-controller';
import { isSnapId } from '@metamask/snaps-utils';
import {
  getAllNamespacesFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
  getEthAccounts,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import {
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { getRelativeLocationForNestedRoutes } from '../routes/utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isEthAddress } from '../../../app/scripts/lib/multichain/address';
import { MILLISECOND } from '../../../shared/constants/time';
import {
  DEFAULT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  CONNECT_SNAPS_CONNECT_ROUTE,
  CONNECT_SNAP_INSTALL_ROUTE,
  CONNECT_SNAP_UPDATE_ROUTE,
  CONNECT_SNAP_RESULT_ROUTE,
} from '../../helpers/constants/routes';
import PermissionPageContainer from '../../components/app/permission-page-container';
import { Box } from '../../components/component-library';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header/snap-authorship-header';
import { State2Wrapper } from '../../components/multichain-accounts/state2-wrapper/state2-wrapper';
import { MultichainAccountsConnectPage } from '../multichain-accounts/multichain-accounts-connect-page/multichain-accounts-connect-page';
import { supportsChainIds } from '../../hooks/useAccountGroupsForPermissions';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../shared/lib/multichain/scope-utils';
import { MultichainEditAccountsPageWrapper } from '../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-account-wrapper';
import ChooseAccount from './choose-account';
import PermissionsRedirect from './redirect';
import SnapsConnect from './snaps/snaps-connect';
import SnapInstall from './snaps/snap-install';
import SnapUpdate from './snaps/snap-update';
import SnapResult from './snaps/snap-result';
import { ConnectPage } from './connect-page/connect-page';
import { getCaip25CaveatValueFromPermissions } from './connect-page/utils';

const APPROVE_TIMEOUT = MILLISECOND * 1200;

function getDefaultSelectedAccounts(currentAddress, permissions) {
  const requestedCaip25CaveatValue =
    getCaip25CaveatValueFromPermissions(permissions);
  const requestedAccounts = getEthAccounts(requestedCaip25CaveatValue);

  if (requestedAccounts.length > 0) {
    return new Set(
      requestedAccounts
        .map((address) => address.toLowerCase())
        // We only consider EVM accounts here (used for `eth_requestAccounts` or `eth_accounts`)
        .filter(isEthAddress),
    );
  }

  // We only consider EVM accounts here (used for `eth_requestAccounts` or `eth_accounts`)
  return new Set(isEthAddress(currentAddress) ? [currentAddress] : []);
}

function getRequestedChainIds(permissions) {
  const requestedCaip25CaveatValue =
    getCaip25CaveatValueFromPermissions(permissions);
  return getPermittedEthChainIds(requestedCaip25CaveatValue);
}

export default class PermissionConnect extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    getRequestAccountTabIds: PropTypes.func.isRequired,
    accounts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        address: PropTypes.string.isRequired,
        metadata: PropTypes.shape({
          name: PropTypes.string.isRequired,
          snap: PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string,
            enabled: PropTypes.bool,
          }),
          keyring: PropTypes.shape({
            type: PropTypes.string.isRequired,
          }).isRequired,
        }).isRequired,
        addressLabel: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        balance: PropTypes.string.isRequired,
      }),
    ).isRequired,
    accountGroups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        accounts: PropTypes.arrayOf(PropTypes.object.isRequired),
      }),
    ).isRequired,
    currentAddress: PropTypes.string.isRequired,
    origin: PropTypes.string,
    showNewAccountModal: PropTypes.func.isRequired,
    newAccountNumber: PropTypes.number.isRequired,
    nativeCurrency: PropTypes.string,
    permissionsRequest: PropTypes.object,
    addressLastConnectedMap: PropTypes.object.isRequired,
    lastConnectedInfo: PropTypes.object.isRequired,
    permissionsRequestId: PropTypes.string,
    navigate: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
    connectPath: PropTypes.string.isRequired,
    confirmPermissionPath: PropTypes.string.isRequired,
    requestType: PropTypes.string.isRequired,
    snapsConnectPath: PropTypes.string.isRequired,
    snapInstallPath: PropTypes.string.isRequired,
    snapUpdatePath: PropTypes.string.isRequired,
    snapResultPath: PropTypes.string.isRequired,
    requestState: PropTypes.object.isRequired,
    approvePendingApproval: PropTypes.func.isRequired,
    rejectPendingApproval: PropTypes.func.isRequired,
    setSnapsInstallPrivacyWarningShownStatus: PropTypes.func.isRequired,
    snapsInstallPrivacyWarningShown: PropTypes.bool.isRequired,
    hideTopBar: PropTypes.bool,
    targetSubjectMetadata: PropTypes.shape({
      extensionId: PropTypes.string,
      iconUrl: PropTypes.string,
      name: PropTypes.string,
      origin: PropTypes.string,
      subjectType: PropTypes.string,
    }),
    isRequestingAccounts: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    origin: '',
    nativeCurrency: '',
    permissionsRequest: undefined,
    permissionsRequestId: '',
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    redirecting: false,
    selectedAccountAddresses: getDefaultSelectedAccounts(
      this.props.currentAddress,
      this.props.permissionsRequest?.permissions,
    ),
    permissionsApproved: null,
    origin: this.props.origin,
    targetSubjectMetadata: this.props.targetSubjectMetadata || {},
    snapsInstallPrivacyWarningShown: this.props.snapsInstallPrivacyWarningShown,
  };

  componentDidMount() {
    const {
      connectPath,
      confirmPermissionPath,
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestType,
      getRequestAccountTabIds,
      permissionsRequest,
      navigate,
      location,
      isRequestingAccounts,
    } = this.props;
    getRequestAccountTabIds();

    if (!permissionsRequest) {
      navigate(DEFAULT_ROUTE, { replace: true });
      return;
    }
    if (location.pathname === connectPath && !isRequestingAccounts) {
      switch (requestType) {
        case 'wallet_installSnap':
          navigate(snapInstallPath, { replace: true });
          break;
        case 'wallet_updateSnap':
          navigate(snapUpdatePath, { replace: true });
          break;
        case 'wallet_installSnapResult':
          navigate(snapResultPath, { replace: true });
          break;
        case 'wallet_connectSnaps':
          navigate(snapsConnectPath, { replace: true });
          break;
        default:
          navigate(confirmPermissionPath, { replace: true });
      }
    }
  }

  componentDidUpdate(prevProps) {
    const { permissionsRequest, lastConnectedInfo, targetSubjectMetadata } =
      this.props;
    const { redirecting, origin } = this.state;

    // We cache the last known good targetSubjectMetadata since it may be null when the approval is cleared
    if (
      targetSubjectMetadata?.origin &&
      prevProps.targetSubjectMetadata?.origin !== targetSubjectMetadata?.origin
    ) {
      this.setState({ targetSubjectMetadata });
    }

    if (!permissionsRequest && prevProps.permissionsRequest && !redirecting) {
      const accountsLastApprovedTime =
        lastConnectedInfo[origin]?.lastApproved || 0;
      const initialAccountsLastApprovedTime =
        prevProps.lastConnectedInfo[origin]?.lastApproved || 0;

      const approved =
        accountsLastApprovedTime > initialAccountsLastApprovedTime;
      this.redirect(approved);
    }
  }

  selectAccounts = (addresses) => {
    const {
      confirmPermissionPath,
      requestType,
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      navigate,
    } = this.props;
    this.setState(
      {
        selectedAccountAddresses: addresses,
      },
      () => {
        switch (requestType) {
          case 'wallet_installSnap':
            navigate(snapInstallPath);
            break;
          case 'wallet_updateSnap':
            navigate(snapUpdatePath);
            break;
          case 'wallet_installSnapResult':
            navigate(snapResultPath);
            break;
          case 'wallet_connectSnaps':
            navigate(snapsConnectPath, { replace: true });
            break;
          default:
            navigate(confirmPermissionPath);
        }
      },
    );
  };

  redirect(approved) {
    const { navigate, permissionsRequest } = this.props;

    let shouldRedirect = true;

    const isRequestingSnap =
      permissionsRequest?.permissions &&
      Object.keys(permissionsRequest.permissions).includes('wallet_snap');

    shouldRedirect = !isRequestingSnap;

    this.setState({
      redirecting: shouldRedirect,
      permissionsApproved: approved,
    });

    if (shouldRedirect && approved) {
      setTimeout(() => navigate(DEFAULT_ROUTE), APPROVE_TIMEOUT);
      return;
    }
    navigate(DEFAULT_ROUTE);
  }

  cancelPermissionsRequest = async (requestId) => {
    const { rejectPermissionsRequest } = this.props;

    if (requestId) {
      await rejectPermissionsRequest(requestId);
      this.redirect(false);
    }
  };

  goBack() {
    const { navigate, connectPath } = this.props;
    navigate(connectPath);
  }

  renderSnapChooseAccountState1 = () => {
    const {
      accounts,
      nativeCurrency,
      showNewAccountModal,
      newAccountNumber,
      addressLastConnectedMap,
      permissionsRequestId,
      targetSubjectMetadata,
    } = this.props;
    const { selectedAccountAddresses } = this.state;

    return (
      <ChooseAccount
        accounts={accounts}
        nativeCurrency={nativeCurrency}
        selectAccounts={(addresses) => this.selectAccounts(addresses)}
        selectNewAccountViaModal={(handleAccountClick) => {
          showNewAccountModal({
            onCreateNewAccount: (address) => handleAccountClick(address),
            newAccountNumber,
          });
        }}
        addressLastConnectedMap={addressLastConnectedMap}
        cancelPermissionsRequest={(requestId) =>
          this.cancelPermissionsRequest(requestId)
        }
        permissionsRequestId={permissionsRequestId}
        selectedAccountAddresses={selectedAccountAddresses}
        targetSubjectMetadata={targetSubjectMetadata}
      />
    );
  };

  renderSnapChooseAccountState2 = () => {
    const { permissionsRequestId, accountGroups, permissionsRequest } =
      this.props;
    const { t } = this.context;
    const requestedCaip25CaveatValue = getCaip25CaveatValueFromPermissions(
      permissionsRequest?.permissions,
    );

    const caipChainIdsToUse = [];

    const requestedCaipChainIds = getAllScopesFromCaip25CaveatValue(
      requestedCaip25CaveatValue,
    ).filter((chainId) => {
      const { namespace } = parseCaipChainId(chainId);
      return namespace !== KnownCaipNamespace.Wallet;
    });
    const requestedNamespaces = getAllNamespacesFromCaip25CaveatValue(
      requestedCaip25CaveatValue,
    );

    if (requestedCaipChainIds.length > 0) {
      requestedCaipChainIds.forEach((chainId) => {
        caipChainIdsToUse.push(chainId);
      });
    }

    if (requestedNamespaces.includes(KnownCaipNamespace.Eip155)) {
      caipChainIdsToUse.push(`${KnownCaipNamespace.Eip155}:0`);
    }

    return (
      <MultichainEditAccountsPageWrapper
        title={t('connectWithMetaMask')}
        permissions={permissionsRequest?.permissions}
        onSubmit={(accountGroupIds) => {
          const filteredAccountGroups = accountGroups.filter(
            (group) =>
              accountGroupIds.includes(group.id) &&
              supportsChainIds(group, caipChainIdsToUse),
          );
          const addresses = getCaip25AccountIdsFromAccountGroupAndScope(
            filteredAccountGroups,
            caipChainIdsToUse,
          ).map(
            (caip25AccountId) => parseCaipAccountId(caip25AccountId).address,
          );
          this.selectAccounts(new Set(addresses));
        }}
        onClose={() => this.cancelPermissionsRequest(permissionsRequestId)}
      />
    );
  };

  renderConnectPageState1 = () => {
    const connectPageProps = {
      rejectPermissionsRequest: (requestId) =>
        this.cancelPermissionsRequest(requestId),
      activeTabOrigin: this.state.origin,
      request: this.props.permissionsRequest || {},
      permissionsRequestId: this.props.permissionsRequestId,
      approveConnection: this.approveConnection,
      targetSubjectMetadata: this.props.targetSubjectMetadata,
    };

    return <ConnectPage {...connectPageProps} />;
  };

  renderConnectPageState2 = () => {
    const connectPageProps = {
      rejectPermissionsRequest: (requestId) =>
        this.cancelPermissionsRequest(requestId),
      activeTabOrigin: this.state.origin,
      request: this.props.permissionsRequest || {},
      permissionsRequestId: this.props.permissionsRequestId,
      approveConnection: this.approveConnection,
      targetSubjectMetadata: this.props.targetSubjectMetadata,
    };

    return <MultichainAccountsConnectPage {...connectPageProps} />;
  };

  renderTopBar(permissionsRequestId) {
    const { targetSubjectMetadata } = this.state;
    const handleCancelFromHeader = () => {
      this.cancelPermissionsRequest(permissionsRequestId);
    };
    return (
      <Box
        style={{
          boxShadow:
            targetSubjectMetadata.subjectType === SubjectType.Snap &&
            'var(--shadow-size-lg) var(--color-shadow-default)',
        }}
      >
        {targetSubjectMetadata.subjectType === SubjectType.Snap && (
          <SnapAuthorshipHeader
            snapId={targetSubjectMetadata.origin}
            boxShadow="none"
            onCancel={handleCancelFromHeader}
          />
        )}
      </Box>
    );
  }

  approveConnection = (...args) => {
    const { approvePermissionsRequest } = this.props;
    approvePermissionsRequest(...args);
    this.redirect(true);
  };

  render() {
    const {
      accounts,
      permissionsRequest,
      permissionsRequestId,
      connectPath,
      hideTopBar,
      targetSubjectMetadata,
      requestState,
      approvePendingApproval,
      rejectPendingApproval,
      setSnapsInstallPrivacyWarningShownStatus,
      approvePermissionsRequest,
      navigate,
      location,
    } = this.props;
    const {
      selectedAccountAddresses,
      permissionsApproved,
      redirecting,
      snapsInstallPrivacyWarningShown,
    } = this.state;

    const isRequestingSnap = isSnapId(permissionsRequest?.metadata?.origin);

    // Create a relative location for nested v5-compat Routes
    const relativeLocation = getRelativeLocationForNestedRoutes(
      location,
      connectPath,
    );

    return (
      <div className="permissions-connect">
        {!hideTopBar && this.renderTopBar(permissionsRequestId)}
        {redirecting && permissionsApproved ? (
          <PermissionsRedirect subjectMetadata={targetSubjectMetadata} />
        ) : (
          <Routes location={relativeLocation}>
            <Route
              path="/"
              element={(() => {
                if (isRequestingSnap) {
                  return (
                    <State2Wrapper
                      state1Component={this.renderSnapChooseAccountState1}
                      state2Component={this.renderSnapChooseAccountState2}
                    />
                  );
                }
                return (
                  <State2Wrapper
                    state1Component={this.renderConnectPageState1}
                    state2Component={this.renderConnectPageState2}
                  />
                );
              })()}
            />
            <Route
              path={CONNECT_CONFIRM_PERMISSIONS_ROUTE}
              element={
                <PermissionPageContainer
                  request={permissionsRequest || {}}
                  approvePermissionsRequest={(...args) => {
                    approvePermissionsRequest(...args);
                    this.redirect(true);
                  }}
                  rejectPermissionsRequest={(requestId) =>
                    this.cancelPermissionsRequest(requestId)
                  }
                  selectedAccounts={accounts.filter((account) =>
                    selectedAccountAddresses.has(account.address),
                  )}
                  requestedChainIds={getRequestedChainIds(
                    permissionsRequest?.permissions,
                  )}
                  targetSubjectMetadata={targetSubjectMetadata}
                  navigate={navigate}
                  connectPath={connectPath}
                  snapsInstallPrivacyWarningShown={
                    snapsInstallPrivacyWarningShown
                  }
                  setSnapsInstallPrivacyWarningShownStatus={
                    setSnapsInstallPrivacyWarningShownStatus
                  }
                />
              }
            />
            <Route
              path={CONNECT_SNAPS_CONNECT_ROUTE}
              element={
                <SnapsConnect
                  request={permissionsRequest || {}}
                  approveConnection={this.approveConnection}
                  rejectConnection={(requestId) =>
                    this.cancelPermissionsRequest(requestId)
                  }
                  targetSubjectMetadata={targetSubjectMetadata}
                  snapsInstallPrivacyWarningShown={
                    snapsInstallPrivacyWarningShown
                  }
                  setSnapsInstallPrivacyWarningShownStatus={
                    setSnapsInstallPrivacyWarningShownStatus
                  }
                />
              }
            />
            <Route
              path={CONNECT_SNAP_INSTALL_ROUTE}
              element={
                <SnapInstall
                  request={permissionsRequest || {}}
                  requestState={requestState || {}}
                  approveSnapInstall={(requestId) => {
                    approvePendingApproval(requestId, {
                      ...permissionsRequest,
                      permissions: requestState.permissions,
                      approvedAccounts: [...selectedAccountAddresses],
                    });
                    this.setState({ permissionsApproved: true });
                  }}
                  rejectSnapInstall={(requestId) => {
                    rejectPendingApproval(
                      requestId,
                      serializeError(providerErrors.userRejectedRequest()),
                    );
                    this.setState({ permissionsApproved: true });
                  }}
                  targetSubjectMetadata={targetSubjectMetadata}
                />
              }
            />
            <Route
              path={CONNECT_SNAP_UPDATE_ROUTE}
              element={
                <SnapUpdate
                  request={permissionsRequest || {}}
                  requestState={requestState || {}}
                  approveSnapUpdate={(requestId) => {
                    approvePendingApproval(requestId, {
                      ...permissionsRequest,
                      permissions: requestState.permissions,
                      approvedAccounts: [...selectedAccountAddresses],
                    });
                    this.setState({ permissionsApproved: true });
                  }}
                  rejectSnapUpdate={(requestId) => {
                    rejectPendingApproval(
                      requestId,
                      serializeError(providerErrors.userRejectedRequest()),
                    );
                    this.setState({ permissionsApproved: false });
                  }}
                  targetSubjectMetadata={targetSubjectMetadata}
                />
              }
            />
            <Route
              path={CONNECT_SNAP_RESULT_ROUTE}
              element={
                <SnapResult
                  request={permissionsRequest || {}}
                  requestState={requestState || {}}
                  approveSnapResult={(requestId) => {
                    approvePendingApproval(requestId);
                    this.setState({ permissionsApproved: true });
                  }}
                  targetSubjectMetadata={targetSubjectMetadata}
                />
              }
            />
          </Routes>
        )}
      </div>
    );
  }
}
