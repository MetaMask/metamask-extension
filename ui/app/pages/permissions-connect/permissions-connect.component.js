import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
} from '../../../../app/scripts/lib/enums'
import {
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'
import PermissionPageContainer from '../../components/app/permission-page-container'
import ChooseAccount from './choose-account'
import PermissionsRedirect from './redirect'

const APPROVE_TIMEOUT = 1500
const REJECT_TIMEOUT = 750

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
    permissionsApproved: null,
    origin: this.props.origin,
    targetDomainMetadata: this.props.targetDomainMetadata || {},
  }

  beforeUnload = () => {
    const { permissionsRequestId, rejectPermissionsRequest } = this.props
    const { permissionsApproved } = this.state

    if (permissionsApproved === null && permissionsRequestId) {
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

  componentDidUpdate (prevProps) {
    const { permissionsRequest, lastConnectedInfo, targetDomainMetadata } = this.props
    const { redirecting, origin, targetDomainMetadata: savedMetadata } = this.state

    if (savedMetadata.name !== targetDomainMetadata?.name) {
      this.setState({
        targetDomainMetadata,
      })
    }

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

  redirectFlow (approved) {
    const { history } = this.props

    this.setState({
      redirecting: true,
      permissionsApproved: approved,
    })
    this.removeBeforeUnload()

    const timeout = approved ? APPROVE_TIMEOUT : REJECT_TIMEOUT

    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      setTimeout(async () => {
        global.platform.closeCurrentWindow()
      }, timeout)
    } else {
      setTimeout(async () => {
        history.push(DEFAULT_ROUTE)
      }, timeout)
    }
  }

  cancelPermissionsRequest = async (requestId) => {

    const { rejectPermissionsRequest } = this.props

    if (requestId) {
      await rejectPermissionsRequest(requestId)

      if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
        window.close()
      } else {
        this.redirectFlow(false)
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
      accounts,
      showNewAccountModal,
      newAccountNumber,
      nativeCurrency,
      permissionsRequest,
      addressLastConnectedMap,
      permissionsRequestId,
      connectPath,
      confirmPermissionPath,
    } = this.props
    const {
      selectedAccountAddresses,
      permissionsApproved,
      origin,
      redirecting,
      targetDomainMetadata,
    } = this.state

    return (
      <div className="permissions-connect">
        { this.renderTopBar() }
        {
          redirecting
            ? (
              <PermissionsRedirect
                domainMetadata={targetDomainMetadata}
                permissionsRejected={ permissionsApproved === false }
              />
            )
            : (
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
                      rejectPermissionsRequest={(requestId) => this.cancelPermissionsRequest(requestId)}
                      selectedIdentities={accounts.filter((account) => selectedAccountAddresses.has(account.address))}
                      cachedOrigin={origin}
                    />
                  )}
                />
              </Switch>
            )
        }
      </div>
    )
  }
}
