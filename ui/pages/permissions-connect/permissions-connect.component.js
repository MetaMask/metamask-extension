import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import { ethErrors, serializeError } from 'eth-rpc-errors';
///: END:ONLY_INCLUDE_IN
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { MILLISECOND } from '../../../shared/constants/time';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import PermissionPageContainer from '../../components/app/permission-page-container';
import { Icon, IconName, IconSize } from '../../components/component-library';
import ChooseAccount from './choose-account';
import PermissionsRedirect from './redirect';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import SnapsConnect from './snaps/snaps-connect';
import SnapInstall from './snaps/snap-install';
import SnapUpdate from './snaps/snap-update';
import SnapResult from './snaps/snap-result';
///: END:ONLY_INCLUDE_IN

const APPROVE_TIMEOUT = MILLISECOND * 1200;

export default class PermissionConnect extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    getRequestAccountTabIds: PropTypes.func.isRequired,
    accounts: PropTypes.array.isRequired,
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
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    snapsConnectPath: PropTypes.string.isRequired,
    snapInstallPath: PropTypes.string.isRequired,
    snapUpdatePath: PropTypes.string.isRequired,
    snapResultPath: PropTypes.string.isRequired,
    requestState: PropTypes.object.isRequired,
    approvePendingApproval: PropTypes.func.isRequired,
    rejectPendingApproval: PropTypes.func.isRequired,
    setSnapsInstallPrivacyWarningShownStatus: PropTypes.func.isRequired,
    snapsInstallPrivacyWarningShown: PropTypes.bool.isRequired,
    ///: END:ONLY_INCLUDE_IN
    hideTopBar: PropTypes.bool,
    totalPages: PropTypes.string.isRequired,
    page: PropTypes.string.isRequired,
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
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    snapsInstallPrivacyWarningShown: this.props.snapsInstallPrivacyWarningShown,
    ///: END:ONLY_INCLUDE_IN
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
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestType,
      ///: END:ONLY_INCLUDE_IN
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
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)

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
          ///: END:ONLY_INCLUDE_IN
          history.replace(confirmPermissionPath);
        ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      }
      ///: END:ONLY_INCLUDE_IN
    }
  }

  static getDerivedStateFromProps(props, state) {
    const { permissionsRequest, targetSubjectMetadata } = props;
    const { targetSubjectMetadata: savedMetadata } = state;

    if (
      permissionsRequest &&
      savedMetadata.origin !== targetSubjectMetadata?.origin
    ) {
      return { targetSubjectMetadata };
    }
    return null;
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
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
    this.setState(
      {
        selectedAccountAddresses: addresses,
      },
      () => {
        switch (requestType) {
          ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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
          ///: END:ONLY_INCLUDE_IN
          default:
            this.props.history.push(confirmPermissionPath);
        }
      },
    );
  };

  redirect(approved) {
    const {
      history,
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      permissionsRequest,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    let shouldRedirect = true;

    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    const isRequestingSnap =
      permissionsRequest?.permissions &&
      Object.keys(permissionsRequest.permissions).includes('wallet_snap');

    shouldRedirect = !isRequestingSnap;
    ///: END:ONLY_INCLUDE_IN

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
    const { redirecting } = this.state;
    const { page, isRequestingAccounts, totalPages } = this.props;
    const { t } = this.context;
    return redirecting ? null : (
      <div className="permissions-connect__top-bar">
        {page === '2' && isRequestingAccounts ? (
          <div
            className="permissions-connect__back"
            onClick={() => this.goBack()}
          >
            <Icon
              name={IconName.ArrowRight}
              marginInlineEnd={1}
              size={IconSize.Xs}
            />
            {t('back')}
          </div>
        ) : null}
        {isRequestingAccounts ? (
          <div className="permissions-connect__page-count">
            {t('xOfY', [page, totalPages])}
          </div>
        ) : null}
      </div>
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
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      snapsConnectPath,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestState,
      approvePendingApproval,
      rejectPendingApproval,
      setSnapsInstallPrivacyWarningShownStatus,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
    const {
      selectedAccountAddresses,
      permissionsApproved,
      redirecting,
      targetSubjectMetadata,
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      snapsInstallPrivacyWarningShown,
      ///: END:ONLY_INCLUDE_IN
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
                  selectedIdentities={accounts.filter((account) =>
                    selectedAccountAddresses.has(account.address),
                  )}
                  targetSubjectMetadata={targetSubjectMetadata}
                  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
                  snapsInstallPrivacyWarningShown={
                    snapsInstallPrivacyWarningShown
                  }
                  setSnapsInstallPrivacyWarningShownStatus={
                    setSnapsInstallPrivacyWarningShownStatus
                  }
                  ///: END:ONLY_INCLUDE_IN
                />
              )}
            />
            {
              ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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
              ///: END:ONLY_INCLUDE_IN
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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
              ///: END:ONLY_INCLUDE_IN
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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
              ///: END:ONLY_INCLUDE_IN
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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
              ///: END:ONLY_INCLUDE_IN
            }
          </Switch>
        )}
      </div>
    );
  }
}
