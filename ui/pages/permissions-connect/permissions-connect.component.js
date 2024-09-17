import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { SubjectType } from '@metamask/permission-controller';
import { isEthAddress } from '../../../app/scripts/lib/multichain/address';
import { MILLISECOND } from '../../../shared/constants/time';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import PermissionPageContainer from '../../components/app/permission-page-container';
import { Box } from '../../components/component-library';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header/snap-authorship-header';
import PermissionConnectHeader from '../../components/app/permission-connect-header';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../shared/constants/permissions';
import { PermissionNames } from '../../../app/scripts/controllers/permissions';
import ChooseAccount from './choose-account';
import PermissionsRedirect from './redirect';
import SnapsConnect from './snaps/snaps-connect';
import SnapInstall from './snaps/snap-install';
import SnapUpdate from './snaps/snap-update';
import SnapResult from './snaps/snap-result';

const APPROVE_TIMEOUT = MILLISECOND * 1200;

function getDefaultSelectedAccounts(currentAddress, permissionsRequest) {
  const permission =
    permissionsRequest?.permissions?.[RestrictedMethods.eth_accounts];
  const requestedAccounts = permission?.caveats?.find(
    (caveat) => caveat.type === CaveatTypes.restrictReturnedAccounts,
  )?.value;

  if (requestedAccounts) {
    return new Set(
      requestedAccounts
        .map((address) => address.toLowerCase())
        .filter(isEthAddress),
    );
  }

  return new Set(isEthAddress(currentAddress) ? [currentAddress] : []);
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
      this.props.permissionsRequest,
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
    // if this is an incremental permission request for permitted chains, skip the account selection
    if (
      permissionsRequest?.diff?.permissionDiffMap?.[
        PermissionNames.permittedChains
      ]
    ) {
      history.replace(confirmPermissionPath);
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
    const { permissionsRequest, lastConnectedInfo } = this.props;
    const { redirecting, origin } = this.state;

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
        {targetSubjectMetadata.subjectType === SubjectType.Snap ? (
          <SnapAuthorshipHeader
            snapId={targetSubjectMetadata.origin}
            boxShadow="none"
            onCancel={handleCancelFromHeader}
          />
        ) : (
          <PermissionConnectHeader
            origin={targetSubjectMetadata.origin}
            iconUrl={targetSubjectMetadata.iconUrl}
          />
        )}
      </Box>
    );
  }

  render() {
    const {
      approvePermissionsRequest,
      accounts,
      showNewAccountModal,
      newAccountNumber,
      nativeCurrency,
      permissionsRequest,
      addressLastConnectedMap,
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
    } = this.props;
    const {
      selectedAccountAddresses,
      permissionsApproved,
      redirecting,
      snapsInstallPrivacyWarningShown,
    } = this.state;

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
              render={() => (
                <ChooseAccount
                  accounts={accounts}
                  nativeCurrency={nativeCurrency}
                  selectAccounts={(addresses) => this.selectAccounts(addresses)}
                  selectNewAccountViaModal={(handleAccountClick) => {
                    showNewAccountModal({
                      onCreateNewAccount: (address) =>
                        handleAccountClick(address),
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
              )}
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
                  targetSubjectMetadata={targetSubjectMetadata}
                  history={this.props.history}
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
                  approveConnection={(...args) => {
                    approvePermissionsRequest(...args);
                    this.redirect(true);
                  }}
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
                      serializeError(ethErrors.provider.userRejectedRequest()),
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
                      serializeError(ethErrors.provider.userRejectedRequest()),
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
