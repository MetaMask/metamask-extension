import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import ChooseAccount from './choose-account'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
} from '../../../../app/scripts/lib/enums'
import {
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'
import PermissionPageContainer from '../../components/app/permission-page-container'

export default class PermissionConnect extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    getRequestAccountTabIds: PropTypes.func.isRequired,
    getCurrentWindowTab: PropTypes.func.isRequired,
    accounts: PropTypes.array.isRequired,
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
    page: PropTypes.string.isRequired,
    targetDomainMetadata: PropTypes.object,
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }).isRequired,
  }

  static defaultProps = {
    origin: '',
    nativeCurrency: '',
    permissionsRequest: undefined,
    permissionsRequestId: '',
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    redirecting: false,
    selectedAccountAddresses: this.props.accounts.length === 1
      ? new Set([this.props.accounts[0].address])
      : new Set(),
    permissionAccepted: null,
    origin: this.props.origin,
  }

  beforeUnload = () => {
    const { permissionsRequestId, rejectPermissionsRequest } = this.props
    const { permissionAccepted } = this.state

    if (permissionAccepted === null && permissionsRequestId) {
      rejectPermissionsRequest(permissionsRequestId)
    }
  }

  removeBeforeUnload = () => {
    const environmentType = getEnvironmentType()
    if (
      environmentType === ENVIRONMENT_TYPE_FULLSCREEN ||
      environmentType === ENVIRONMENT_TYPE_NOTIFICATION
    ) {
      window.removeEventListener('beforeunload', this.beforeUnload)
    }
  }

  componentDidUpdate (prevProps) {
    const { permissionsRequest, lastConnectedInfo } = this.props
    const { redirecting, origin } = this.state

    if (!permissionsRequest && prevProps.permissionsRequest && !redirecting) {

      const accountsLastApprovedTime = lastConnectedInfo[origin]?.lastApproved || 0
      const initialAccountsLastApprovedTime = prevProps.lastConnectedInfo[origin]?.lastApproved || 0

      if (accountsLastApprovedTime > initialAccountsLastApprovedTime) {
        this.redirectFlow(true)
      } else {
        this.redirectFlow(false)
      }
    }
  }

  selectAccounts = (addresses) => {
    this.setState({
      selectedAccountAddresses: addresses,
    }, () => this.props.history.push(this.props.confirmPermissionPath))
  }

  redirectFlow (accepted) {
    const { history, location, confirmPermissionPath } = this.props

    this.setState({
      redirecting: true,
      permissionAccepted: accepted,
    })
    this.removeBeforeUnload()

    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      setTimeout(async () => {
        global.platform.closeCurrentWindow()
      }, 1500)
    } else if (location.pathname === confirmPermissionPath) {
      setTimeout(async () => {
        history.push(DEFAULT_ROUTE)
      }, 1500)
    } else {
      history.push(DEFAULT_ROUTE)
    }
  }

  componentDidMount () {
    const {
      getCurrentWindowTab,
      getRequestAccountTabIds,
      permissionsRequest,
      history,
    } = this.props
    getCurrentWindowTab()
    getRequestAccountTabIds()

    if (!permissionsRequest) {
      return history.push(DEFAULT_ROUTE)
    }

    const environmentType = getEnvironmentType()
    if (
      environmentType === ENVIRONMENT_TYPE_FULLSCREEN ||
      environmentType === ENVIRONMENT_TYPE_NOTIFICATION
    ) {
      window.addEventListener('beforeunload', this.beforeUnload)
    }
  }

  cancelPermissionsRequest = async (requestId) => {

    const { history, rejectPermissionsRequest } = this.props

    if (requestId) {
      await rejectPermissionsRequest(requestId)

      if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
        window.close()
      } else {
        history.push(DEFAULT_ROUTE)
      }
    }
  }

  goBack () {
    const { history, connectPath } = this.props
    history.push(connectPath)
  }

  renderTopBar () {
    const { redirecting } = this.state
    const { page } = this.props
    const { t } = this.context
    return !redirecting
      ? (
        <div
          className="permissions-connect__top-bar"
        >
          { page === '2'
            ? (
              <div className="permissions-connect__back" onClick={() => this.goBack()}>
                <i className="fas fa-chevron-left" />
                { t('back') }
              </div>
            )
            : null
          }
          <div className="permissions-connect__page-count">
            { t('xOfY', [ page, '2' ]) }
          </div>
        </div>
      )
      : null
  }

  render () {
    const {
      approvePermissionsRequest,
      rejectPermissionsRequest,
      accounts,
      showNewAccountModal,
      newAccountNumber,
      nativeCurrency,
      permissionsRequest,
      addressLastConnectedMap,
      permissionsRequestId,
      connectPath,
      confirmPermissionPath,
      targetDomainMetadata,
    } = this.props
    const {
      selectedAccountAddresses,
      permissionAccepted,
      origin,
      redirecting,
    } = this.state

    return (
      <div className="permissions-connect">
        { this.renderTopBar() }
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
                    onCreateNewAccount: (address) => handleAccountClick(address),
                    newAccountNumber,
                  })
                }}
                addressLastConnectedMap={addressLastConnectedMap}
                cancelPermissionsRequest={(requestId) => this.cancelPermissionsRequest(requestId)}
                permissionsRequestId={permissionsRequestId}
                selectedAccountAddresses={selectedAccountAddresses}
                targetDomainMetadata={targetDomainMetadata}
              />
            )}
          />
          <Route
            path={confirmPermissionPath}
            exact
            render={() => (
              <PermissionPageContainer
                request={permissionsRequest || {}}
                approvePermissionsRequest={(request, accounts) => {
                  approvePermissionsRequest(request, accounts)
                  this.redirectFlow(true)
                }}
                rejectPermissionsRequest={(requestId) => {
                  rejectPermissionsRequest(requestId)
                  this.redirectFlow(false)
                }}
                selectedIdentities={accounts.filter((account) => selectedAccountAddresses.has(account.address))}
                redirect={redirecting}
                permissionRejected={ permissionAccepted === false }
                cachedOrigin={origin}
              />
            )}
          />
        </Switch>
      </div>
    )
  }
}
