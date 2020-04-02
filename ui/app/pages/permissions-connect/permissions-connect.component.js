import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import PermissionsConnectFooter from './permissions-connect-footer'
import ChooseAccount from './choose-account'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../app/scripts/lib/enums'
import {
  DEFAULT_ROUTE,
  CONNECTED_ROUTE,
} from '../../helpers/constants/routes'
import PermissionPageContainer from '../../components/app/permission-page-container'

export default class PermissionConnect extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    getRequestAccountTabIds: PropTypes.func.isRequired,
    getCurrentWindowTab: PropTypes.func.isRequired,
    accounts: PropTypes.array.isRequired,
    originName: PropTypes.string,
    showNewAccountModal: PropTypes.func.isRequired,
    newAccountNumber: PropTypes.number.isRequired,
    nativeCurrency: PropTypes.string,
    permissionsRequest: PropTypes.object,
    addressLastConnectedMap: PropTypes.object,
    requestAccountTabs: PropTypes.object,
    permissionsRequestId: PropTypes.string,
    domains: PropTypes.object,
    history: PropTypes.object.isRequired,
    connectPath: PropTypes.string.isRequired,
    confirmPermissionPath: PropTypes.string.isRequired,
    page: PropTypes.string.isRequired,
    redirecting: PropTypes.bool,
    targetDomainMetadata: PropTypes.object,
  }

  static defaultProps = {
    originName: '',
    nativeCurrency: '',
    permissionsRequest: undefined,
    addressLastConnectedMap: {},
    requestAccountTabs: {},
    permissionsRequestId: '',
    domains: {},
    redirecting: false,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    redirecting: false,
    selectedAccountAddresses: new Set(),
    permissionAccepted: null,
    originName: this.props.originName,
  }

  beforeUnload = () => {
    const { permissionsRequestId, rejectPermissionsRequest } = this.props
    const { permissionAccepted } = this.state

    if (permissionAccepted === null && permissionsRequestId) {
      rejectPermissionsRequest(permissionsRequestId)
    }
  }

  removeBeforeUnload = () => {
    if (getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN) {
      window.removeEventListener('beforeunload', this.beforeUnload)
    }
  }

  componentDidUpdate (prevProps) {
    const { domains, permissionsRequest, redirecting } = this.props
    const { originName } = this.state

    if (!permissionsRequest && prevProps.permissionsRequest && !redirecting) {
      const permissionDataForDomain = (domains && domains[originName]) || {}
      const permissionsForDomain = permissionDataForDomain.permissions || []
      const prevPermissionDataForDomain = (prevProps.domains && prevProps.domains[originName]) || {}
      const prevPermissionsForDomain = prevPermissionDataForDomain.permissions || []
      const addedAPermission = permissionsForDomain.length > prevPermissionsForDomain.length
      if (addedAPermission) {
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
    const { requestAccountTabs, history } = this.props
    const { originName } = this.state

    this.setState({
      redirecting: true,
      permissionAccepted: accepted,
    })
    this.removeBeforeUnload()

    if (getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN) {
      setTimeout(async () => {
        const currentTab = await global.platform.currentTab()
        try {
          if (currentTab.active) {
            await global.platform.switchToTab(requestAccountTabs[originName])
          }
        } finally {
          global.platform.closeTab(currentTab.id)
        }
      }, 2000)
    } else if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      history.push(DEFAULT_ROUTE)
    } else if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
      history.push(CONNECTED_ROUTE)
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

    if (getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN) {
      window.addEventListener('beforeunload', this.beforeUnload)
    }
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
      page,
      targetDomainMetadata,
    } = this.props
    const {
      selectedAccountAddresses,
      permissionAccepted,
      originName,
      redirecting,
    } = this.state

    return (
      <div className="permissions-connect">
        { !redirecting
          ? (
            <div className="permissions-connect__page-count-wrapper">
              <div className="permissions-connect-header__page-count">
                { `${page}/2` }
              </div>
            </div>
          )
          : null
        }
        <Switch>
          <Route
            path={connectPath}
            exact
            render={() => (
              <div>
                <ChooseAccount
                  accounts={accounts}
                  originName={originName}
                  nativeCurrency={nativeCurrency}
                  selectAccounts={(addresses) => this.selectAccounts(addresses)}
                  selectNewAccountViaModal={(handleAccountClick) => {
                    showNewAccountModal({
                      onCreateNewAccount: (address) => handleAccountClick(address),
                      newAccountNumber,
                    })
                  }}
                  addressLastConnectedMap={addressLastConnectedMap}
                  cancelPermissionsRequest={(requestId) => {
                    if (requestId) {
                      rejectPermissionsRequest(requestId)
                      this.redirectFlow(false)
                    }
                  }}
                  permissionsRequestId={permissionsRequestId}
                  selectedAccountAddresses={selectedAccountAddresses}
                  targetDomainMetadata={targetDomainMetadata}
                />
                { !redirecting ? <PermissionsConnectFooter /> : null }
              </div>
            )}
          />
          <Route
            path={confirmPermissionPath}
            exact
            render={() => (
              <div>
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
                  cachedOrigin={originName}
                />
                { !redirecting ? <PermissionsConnectFooter /> : null }
              </div>
            )}
          />
        </Switch>
      </div>
    )
  }
}
