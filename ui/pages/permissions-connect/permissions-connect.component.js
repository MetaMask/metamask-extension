import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { ethErrors, serializeError } from 'eth-rpc-errors';
///: END:ONLY_INCLUDE_IN
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { MILLISECOND } from '../../../shared/constants/time';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import PermissionPageContainer from '../../components/app/permission-page-container';
import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../components/component-library/icon/deprecated';
import ChooseAccount from './choose-account';
import PermissionsRedirect from './redirect';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import SnapInstall from './flask/snap-install';
import SnapUpdate from './flask/snap-update';
import SnapResult from './flask/snap-result';
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
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    snapInstallPath: PropTypes.string.isRequired,
    snapUpdatePath: PropTypes.string.isRequired,
    snapResultPath: PropTypes.string.isRequired,
    requestType: PropTypes.string.isRequired,
    requestState: PropTypes.object.isRequired,
    approvePendingApproval: PropTypes.func.isRequired,
    rejectPendingApproval: PropTypes.func.isRequired,
    ///: END:ONLY_INCLUDE_IN
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
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
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
      history.push(DEFAULT_ROUTE);
      return;
    }

    const environmentType = getEnvironmentType();
    if (environmentType === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.addEventListener('beforeunload', this.beforeUnload);
    }

    if (history.location.pathname === connectPath && !isRequestingAccounts) {
      ///: BEGIN:ONLY_INCLUDE_IN(flask)

      switch (requestType) {
        case 'wallet_installSnap':
          history.push(snapInstallPath);
          break;
        case 'wallet_updateSnap':
          history.push(snapUpdatePath);
          break;
        case 'wallet_installSnapResult':
          history.push(snapResultPath);
          break;
        default:
          ///: END:ONLY_INCLUDE_IN
          history.push(confirmPermissionPath);
        ///: BEGIN:ONLY_INCLUDE_IN(flask)
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
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestType,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
    this.setState(
      {
        selectedAccountAddresses: addresses,
      },
      ///: BEGIN:ONLY_INCLUDE_IN(main,beta)
      () => this.props.history.push(confirmPermissionPath),
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
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
          default:
            this.props.history.push(confirmPermissionPath);
        }
      },
      ///: END:ONLY_INCLUDE_IN
    );
  };

  redirect(approved) {
    const {
      history,
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      permissionsRequest,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    const isRequestingSnap =
      permissionsRequest?.permissions &&
      Object.keys(permissionsRequest.permissions).includes('wallet_snap');

    const shouldRedirect = !isRequestingSnap;

    this.setState({
      redirecting: shouldRedirect,
      permissionsApproved: approved,
    });
    ///: END:ONLY_INCLUDE_IN

    ///: BEGIN:ONLY_INCLUDE_IN(main,beta)
    this.setState({
      redirecting: true,
      permissionsApproved: approved,
    });
    ///: END:ONLY_INCLUDE_IN
    this.removeBeforeUnload();

    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    if (shouldRedirect && approved) {
      setTimeout(() => history.push(DEFAULT_ROUTE), APPROVE_TIMEOUT);
    }
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(main,beta)
    if (approved) {
      setTimeout(() => history.push(DEFAULT_ROUTE), APPROVE_TIMEOUT);
    }
    ///: END:ONLY_INCLUDE_IN
    else {
      history.push(DEFAULT_ROUTE);
    }
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
              name={ICON_NAMES.ARROW_RIGHT}
              marginInlineEnd={1}
              size={ICON_SIZES.XS}
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
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      requestState,
      approvePendingApproval,
      rejectPendingApproval,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
    const {
      selectedAccountAddresses,
      permissionsApproved,
      redirecting,
      targetSubjectMetadata,
    } = this.state;

    return (
      <div className="permissions-connect">
        {this.renderTopBar()}
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
                />
              )}
            />
            {
              ///: BEGIN:ONLY_INCLUDE_IN(flask)
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
              ///: BEGIN:ONLY_INCLUDE_IN(flask)
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
              ///: BEGIN:ONLY_INCLUDE_IN(flask)
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
