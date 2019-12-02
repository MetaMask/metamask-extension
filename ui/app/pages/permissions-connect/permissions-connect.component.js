import PropTypes from 'prop-types'
import React, { Component } from 'react'
import PermissionsConnectHeader from './permissions-connect-header'
import PermissionsConnectFooter from './permissions-connect-footer'
import ChooseAccount from './choose-account'
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
  }

  static defaultProps = {
    originName: '',
    nativeCurrency: '',
    permissionsRequest: {},
    addressLastConnectedMap: {},
    requestAccountTabs: {},
    permissionsRequestId: '',
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    page: 1,
    selectedAccountAddress: '',
    permissionAccepted: null,
    originName: this.props.originName,
  }

  selectAccount = (address) => {
    this.setState({
      page: 2,
      selectedAccountAddress: address,
    })
  }

  redirectFlow (accepted) {
    const { requestAccountTabs } = this.props
    const { originName } = this.state
    this.setState({
      page: null,
      permissionAccepted: accepted,
    })

    setTimeout(async () => {
      const { id: currentTabId } = await global.platform.currentTab()
      try {
        await global.platform.switchToTab(requestAccountTabs[originName])
      } finally {
        global.platform.closeTab(currentTabId)
      }
    }, 2000)
  }

  componentDidMount () {
    const {
      getCurrentWindowTab,
      getRequestAccountTabIds,
    } = this.props
    getCurrentWindowTab()
    getRequestAccountTabIds()
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
    } = this.props
    const { page, selectedAccountAddress, permissionAccepted, originName } = this.state

    return (
      <div className="permissions-connect">
        { page !== null
          ? <PermissionsConnectHeader page={page} />
          : null
        }
        { page === 1
          ? <ChooseAccount
            accounts={accounts}
            originName={originName}
            nativeCurrency={nativeCurrency}
            selectAccount={(address) => this.selectAccount(address)}
            selectNewAccountViaModal={() => {
              showNewAccountModal({
                onCreateNewAccount: this.selectAccount,
                newAccountNumber,
              })
            }}
            addressLastConnectedMap={addressLastConnectedMap}
            cancelPermissionsRequest={requestId => {
              if (requestId) {
                rejectPermissionsRequest(requestId)
                this.redirectFlow(false)
              }
            }}
            permissionsRequestId={permissionsRequestId}
          />
          : <div><PermissionPageContainer
            request={permissionsRequest || {}}
            approvePermissionsRequest={ (requestId, accounts) => {
              approvePermissionsRequest(requestId, accounts)
              this.redirectFlow(true)
            }}
            rejectPermissionsRequest={requestId => {
              rejectPermissionsRequest(requestId)
              this.redirectFlow(false)
            }}
            selectedIdentity={accounts.find(account => account.address === selectedAccountAddress)}
            redirect={page === null}
            permissionRejected={ permissionAccepted === false }
          />
          <PermissionsConnectFooter /></div>
        }
      </div>
    )
  }
}
