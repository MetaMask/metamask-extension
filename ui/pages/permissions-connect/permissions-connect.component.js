import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { SubjectType } from '@metamask/permission-controller';
import { isSnapId } from '@metamask/snaps-utils';
import {
  getEthAccounts,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isEthAddress } from '../../../app/scripts/lib/multichain/address';
import { MILLISECOND } from '../../../shared/constants/time';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import PermissionPageContainer from '../../components/app/permission-page-container';
import { Box } from '../../components/component-library';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header/snap-authorship-header';
import { MultichainEditAccountsPage } from '../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-accounts-page';
import { State2Wrapper } from '../../components/multichain-accounts/state2-wrapper/state2-wrapper';
import ChooseAccount from './choose-account';
import PermissionsRedirect from './redirect';
import SnapsConnect from './snaps/snaps-connect';
import SnapInstall from './snaps/snap-install';
import SnapUpdate from './snaps/snap-update';
import SnapResult from './snaps/snap-result';
import { ConnectPage } from './connect-page/connect-page';
import { getCaip25CaveatValueFromPermissions } from './connect-page/utils';
import { MultichainAccountsConnectPage } from './multichain-accounts-connect-page/multichain-accounts-connect-page';

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
    currentAddress: PropTypes.string.isRequired,
    origin: PropTypes.string,
    showNewAccountModal: PropTypes.func.isRequired,
    newAccountNumber: PropTypes.number.isRequired,
    nativeCurrency: PropTypes.string,
    permissionsRequest: PropTypes.object,
    addressLastConnectedMap: PropTypes.object.isRequired,
    lastConnectedInfo: PropTypes.object.isRequired,
    permissionsRequestId: PropTypes.string,
    history: PropTypes.object.isRequired,
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
      history,
      isRequestingAccounts,
    } = this.props;
    getRequestAccountTabIds();

    if (!permissionsRequest) {
      history.replace(DEFAULT_ROUTE);
      return;
    }
    if (history.location.pathname === connectPath && !isRequestingAccounts) {
      switch (requestType) {
        case 'wallet_installSnap':
          history.replace(snapInstallPath);
          break;
        case 'wallet_updateSnap':
          history.replace(snapUpdatePath);
          break;
        case 'wallet_installSnapResult':
          history.replace(snapResultPath);
          break;
        case 'wallet_connectSnaps':
          history.replace(snapsConnectPath);
          break;
        default:
          history.replace(confirmPermissionPath);
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
    } = this.props;
    this.setState(
      {
        selectedAccountAddresses: addresses,
      },
      () => {
        switch (requestType) {
          case 'wallet_installSnap':
            this.props.history.push(snapInstallPath);
            break;
          case 'wallet_updateSnap':
            this.props.history.push(snapUpdatePath);
            break;
          case 'wallet_installSnapResult':
            this.props.history.push(snapResultPath);
            break;
          case 'wallet_connectSnaps':
            this.props.history.replace(snapsConnectPath);
            break;
          default:
            this.props.history.push(confirmPermissionPath);
        }
      },
    );
  };

  redirect(approved) {
    const { history, permissionsRequest } = this.props;

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
      setTimeout(() => history.push(DEFAULT_ROUTE), APPROVE_TIMEOUT);
      return;
    }
    history.push(DEFAULT_ROUTE);
  }

  cancelPermissionsRequest = async (requestId) => {
    const { rejectPermissionsRequest } = this.props;

    if (requestId) {
      await rejectPermissionsRequest(requestId);
      this.redirect(false);
    }
  };

  goBack() {
    const { history, connectPath } = this.props;
    history.push(connectPath);
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
    const { permissionsRequestId } = this.props;

    return (
      <MultichainEditAccountsPage
        displayChooseAccountPage
        defaultSelectedAccountGroups={[]}
        supportedAccountGroups={[]}
        onSubmit={() => {
          // TODO: Implement onSubmit logic
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
      confirmPermissionPath,
      hideTopBar,
      targetSubjectMetadata,
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestState,
      approvePendingApproval,
      rejectPendingApproval,
      setSnapsInstallPrivacyWarningShownStatus,
      approvePermissionsRequest,
      history,
    } = this.props;
    const {
      selectedAccountAddresses,
      permissionsApproved,
      redirecting,
      snapsInstallPrivacyWarningShown,
    } = this.state;

    const isRequestingSnap = isSnapId(permissionsRequest?.metadata?.origin);

    return (
      <div className="permissions-connect">
        {!hideTopBar && this.renderTopBar(permissionsRequestId)}
        {redirecting && permissionsApproved ? (
          <PermissionsRedirect subjectMetadata={targetSubjectMetadata} />
        ) : (
          <Switch>
            <Route
              path={connectPath}
              exact
              render={() => {
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
              }}
            />
            <Route
              path={confirmPermissionPath}
              exact
              render={() => (
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
                  history={history}
                  connectPath={connectPath}
                  snapsInstallPrivacyWarningShown={
                    snapsInstallPrivacyWarningShown
                  }
                  setSnapsInstallPrivacyWarningShownStatus={
                    setSnapsInstallPrivacyWarningShownStatus
                  }
                />
              )}
            />
            <Route
              path={snapsConnectPath}
              exact
              render={() => (
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
              )}
            />
            <Route
              path={snapInstallPath}
              exact
              render={() => (
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
              )}
            />
            <Route
              path={snapUpdatePath}
              exact
              render={() => (
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
              )}
            />
            <Route
              path={snapResultPath}
              exact
              render={() => (
                <SnapResult
                  request={permissionsRequest || {}}
                  requestState={requestState || {}}
                  approveSnapResult={(requestId) => {
                    approvePendingApproval(requestId);
                    this.setState({ permissionsApproved: true });
                  }}
                  targetSubjectMetadata={targetSubjectMetadata}
                />
              )}
            />
          </Switch>
        )}
      </div>
    );
  }
}
