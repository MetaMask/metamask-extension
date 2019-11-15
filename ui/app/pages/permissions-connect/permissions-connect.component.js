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
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    page: 1,
    selectedAccountAddress: '',
  }

  selectAccount (address) {
    this.setState({
      page: 2,
      selectedAccountAddress: address,
    })
  }

  redirectFlow () {
    const { permissionsRequest, currentMetaMaskTabOpenerId } = this.props
    this.setState({
      page: null,
    })
    setTimeout(() => {
      global.platform.switchToTab(currentMetaMaskTabOpenerId, () => {
        window.close()
      })
    }, 2000)
  }

  componentDidMount () {
    const {
      getOpenMetaMaskTabs,
      getCurrentWindowTab,
    } = this.props
    getCurrentWindowTab()
    getOpenMetaMaskTabs()
  }

  render () {
    const {
      approvePermissionsRequest,
      rejectPermissionsRequest,
      accounts,
      originName,
      showNewAccountModal,
      newAccountNumber,
      nativeCurrency,
      permissionsRequest,
      currentMetaMaskTabOpener,
    } = this.props
    const { page, selectedAccountAddress } = this.state

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
          />
          : <div><PermissionPageContainer
            request={permissionsRequest}
            approvePermissionsRequest={ (requestId, accounts) => {
              approvePermissionsRequest(requestId, accounts)
              this.redirectFlow()
            }}
            rejectPermissionsRequest={rejectPermissionsRequest}
            selectedIdentity={accounts.find(account => account.address === selectedAccountAddress)}
            redirect={page === null}
          />
          <PermissionsConnectFooter /></div>
        }
      </div>
    )
  }
}

