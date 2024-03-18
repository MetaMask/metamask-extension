import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { SubjectType } from '@metamask/permission-controller';
///: END:ONLY_INCLUDE_IF
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { MILLISECOND } from '../../../shared/constants/time';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import PermissionPageContainer from '../../components/app/permission-page-container';
import { Box } from '../../components/component-library';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header/snap-authorship-header';
///: END:ONLY_INCLUDE_IF
import ChooseAccount from './choose-account';
import PermissionsRedirect from './redirect';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import SnapsConnect from './snaps/snaps-connect';
import SnapInstall from './snaps/snap-install';
import SnapUpdate from './snaps/snap-update';
import SnapResult from './snaps/snap-result';
///: END:ONLY_INCLUDE_IF

const APPROVE_TIMEOUT = MILLISECOND * 1200;

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
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    snapsConnectPath: PropTypes.string.isRequired,
    snapInstallPath: PropTypes.string.isRequired,
    snapUpdatePath: PropTypes.string.isRequired,
    snapResultPath: PropTypes.string.isRequired,
    requestState: PropTypes.object.isRequired,
    approvePendingApproval: PropTypes.func.isRequired,
    rejectPendingApproval: PropTypes.func.isRequired,
    setSnapsInstallPrivacyWarningShownStatus: PropTypes.func.isRequired,
    snapsInstallPrivacyWarningShown: PropTypes.bool.isRequired,
    ///: END:ONLY_INCLUDE_IF
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
    selectedAccountAddresses: new Set([this.props.currentAddress]),
    permissionsApproved: null,
    origin: this.props.origin,
    targetSubjectMetadata: this.props.targetSubjectMetadata || {},
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    snapsInstallPrivacyWarningShown: this.props.snapsInstallPrivacyWarningShown,
    ///: END:ONLY_INCLUDE_IF
  };

  beforeUnload = () => {
    const { permissionsRequestId, rejectPermissionsRequest } = this.props;
    const { permissionsApproved } = this.state;

    if (permissionsApproved === null && permissionsRequestId) {
      rejectPermissionsRequest(permissionsRequestId);
    }
  };

  removeBeforeUnload = () => {
    const environmentType = getEnvironmentType();
    if (environmentType === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.removeEventListener('beforeunload', this.beforeUnload);
    }
  };

  componentDidMount() {
    const {
      connectPath,
      confirmPermissionPath,
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestType,
      ///: END:ONLY_INCLUDE_IF
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

    const environmentType = getEnvironmentType();
    if (environmentType === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.addEventListener('beforeunload', this.beforeUnload);
    }

    if (history.location.pathname === connectPath && !isRequestingAccounts) {
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)

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
          ///: END:ONLY_INCLUDE_IF
          history.replace(confirmPermissionPath);
        ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      }
      ///: END:ONLY_INCLUDE_IF
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
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;
    this.setState(
      {
        selectedAccountAddresses: addresses,
      },
      () => {
        switch (requestType) {
          ///: BEGIN:ONLY_INCLUDE_IF(snaps)
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
          ///: END:ONLY_INCLUDE_IF
          default:
            this.props.history.push(confirmPermissionPath);
        }
      },
    );
  };

  redirect(approved) {
    const {
      history,
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      permissionsRequest,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    let shouldRedirect = true;

    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    const isRequestingSnap =
      permissionsRequest?.permissions &&
      Object.keys(permissionsRequest.permissions).includes('wallet_snap');

    shouldRedirect = !isRequestingSnap;
    ///: END:ONLY_INCLUDE_IF

    this.setState({
      redirecting: shouldRedirect,
      permissionsApproved: approved,
    });
    this.removeBeforeUnload();

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

  renderTopBar() {
    const { redirecting, targetSubjectMetadata } = this.state;
    return redirecting ? null : (
      <Box
        style={{
          marginBottom:
            targetSubjectMetadata.subjectType === SubjectType.Snap && '14px',
          boxShadow:
            targetSubjectMetadata.subjectType === SubjectType.Snap &&
            'var(--shadow-size-lg) var(--color-shadow-default)',
        }}
      >
        {targetSubjectMetadata.subjectType === SubjectType.Snap ? (
          <SnapAuthorshipHeader
            snapId={targetSubjectMetadata.origin}
            boxShadow="none"
          />
        ) : (
          <SnapAuthorshipHeader
            website
            websiteName={targetSubjectMetadata.name}
            websiteOrigin={targetSubjectMetadata.origin}
            websiteIconUrl={targetSubjectMetadata.iconUrl}
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
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestState,
      approvePendingApproval,
      rejectPendingApproval,
      setSnapsInstallPrivacyWarningShownStatus,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;
    const {
      selectedAccountAddresses,
      permissionsApproved,
      redirecting,
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      snapsInstallPrivacyWarningShown,
      ///: END:ONLY_INCLUDE_IF
    } = this.state;

    return (
      <div className="permissions-connect">
        {!hideTopBar && this.renderTopBar()}
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
                  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
                  snapsInstallPrivacyWarningShown={
                    snapsInstallPrivacyWarningShown
                  }
                  setSnapsInstallPrivacyWarningShownStatus={
                    setSnapsInstallPrivacyWarningShownStatus
                  }
                  ///: END:ONLY_INCLUDE_IF
                />
              )}
            />
            {
              ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            }
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
            {
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            }
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
                    this.removeBeforeUnload();
                  }}
                  targetSubjectMetadata={targetSubjectMetadata}
                />
              )}
            />
            {
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            }
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
                    this.removeBeforeUnload();
                  }}
                  targetSubjectMetadata={targetSubjectMetadata}
                />
              )}
            />
            {
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            }
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
                    this.removeBeforeUnload();
                  }}
                  targetSubjectMetadata={targetSubjectMetadata}
                />
              )}
            />
            {
              ///: END:ONLY_INCLUDE_IF
            }
          </Switch>
        )}
      </div>
    );
  }
}
