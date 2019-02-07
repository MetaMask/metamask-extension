import React, { Component } from 'react'
import PropTypes from 'prop-types'
import actions from '../../../../ui/app/actions'
import { connect } from 'react-redux'
import { Dropdown, DropdownMenuItem } from '../dropdown'
import ethUtil from 'ethereumjs-util'
import copyToClipboard from 'copy-to-clipboard'
import ethNetProps from 'eth-net-props'
import { getCurrentKeyring, ifContractAcc, ifHardwareAcc, getAllKeyRingsAccounts } from '../../util'
import { importTypes } from '../../accounts/import/enums'
import { getFullABI } from '../../accounts/import/helpers'
import log from 'loglevel'
import Web3 from 'web3'
import { AccountsDropdownItemView } from './accounts-dropdown-item-view'

class AccountsDropdownItemWrapper extends DropdownMenuItem {
  render () {
    return (
      <DropdownMenuItem
        style={{
          padding: '8px 0px',
        }}
        closeMenu={() => {}}
        onClick={() => this.props.onClick()}
      >
        <span className="acc-dd-menu-item-text">{this.props.label}</span>
      </DropdownMenuItem>
    )
  }
}

class AccountDropdowns extends Component {
  static defaultProps = {
    enableAccountsSelector: false,
    enableAccountOptions: false,
  }

  static propTypes = {
    identities: PropTypes.objectOf(PropTypes.object),
    selected: PropTypes.string,
    keyrings: PropTypes.array,
    actions: PropTypes.objectOf(PropTypes.func),
    network: PropTypes.string,
    style: PropTypes.object,
    enableAccountOptions: PropTypes.bool,
    enableAccountsSelector: PropTypes.bool,
  }

  constructor (props) {
    super(props)
    this.state = {
      accountSelectorActive: false,
      optionsMenuActive: false,
      isProxy: false,
      contractProps: null,
    }
    this.accountSelectorToggleClassName = 'accounts-selector'
    this.optionsMenuToggleClassName = 'account-dropdown'
    this.web3 = new Web3(global.ethereumProvider)
  }

  renderAccounts () {
      const { identities, selected, keyrings, network } = this.props
      const accountOrder = getAllKeyRingsAccounts(keyrings, network)

      const accountsViews = accountOrder.map((address, index) => {
        const identity = identities[address]
        if (!identity) {
          return null
        }
        const isSelected = identity.address === selected

        const keyring = getCurrentKeyring(address, network, keyrings, identities)

        let accountsDropdownItemView = <AccountsDropdownItemView
          key={`AccountsDropdownItemView_${index}`}
          isSelected={isSelected}
          keyring={keyring}
          identity={identity}
          closeMenu={() => this.closeMenu()}
        />

        // display contract acc only for network where it was created
        if (ifContractAcc(keyring)) {
          if (keyring.network !== network) {
            accountsDropdownItemView = null
          }
        }

        return accountsDropdownItemView
      })

      return accountsViews
  }

  closeMenu () {
    this.setState({
      accountSelectorActive: false,
      optionsMenuActive: false,
    })
  }

  renderAccountSelector () {
    const { actions } = this.props
    const { accountSelectorActive } = this.state
    let menuItems = []
    menuItems = Object.assign(menuItems, this.renderAccounts())
    const bottomMenuItems = [
      <AccountsDropdownItemWrapper
        key="AccountsDropdownItemAdd"
        onClick={() => actions.addNewAccount()}
        label="Create Account"
      />,
      <AccountsDropdownItemWrapper
        key="AccountsDropdownItemImport"
        onClick={() => actions.showImportPage()}
        label="Import Account"
      />,
      <AccountsDropdownItemWrapper
        key="AccountsDropdownItemConnectHD"
        onClick={() => actions.showConnectHWWalletPage()}
        label="Connect hardware wallet"
      />,
    ]
    menuItems = menuItems.concat(bottomMenuItems)

    return (
      <Dropdown
        useCssTransition={true} // Hardcoded because account selector is temporarily in app-header
        style={{
          position: 'absolute',
          marginLeft: '-213px',
          top: '38px',
          minWidth: '180px',
          maxHeight: accountSelectorActive ? '300px' : '0px',
          width: '265px',
        }}
        innerStyle={{
          padding: '8px 25px',
        }}
        isOpen={accountSelectorActive}
        onClickOutside={(event) => {
          const { classList } = event.target
          const isNotToggleElement = !classList.contains(this.accountSelectorToggleClassName)
          if (accountSelectorActive && isNotToggleElement) {
            this.setState({ accountSelectorActive: false })
          }
        }}
      >
        {menuItems}
      </Dropdown>
    )
  }

  renderAccountOptions () {
    const { actions, selected, network, keyrings, identities } = this.props
    const { optionsMenuActive, isProxy } = this.state

    const keyring = getCurrentKeyring(selected, network, keyrings, identities)

    return (
      <Dropdown
        style={{
          position: 'relative',
          marginLeft: '-234px',
          minWidth: '180px',
          top: '30px',
          width: '280px',
        }}
        isOpen={optionsMenuActive}
        onClickOutside={(event) => {
          const { classList } = event.target
          const isNotToggleElement = !classList.contains(this.optionsMenuToggleClassName)
          if (optionsMenuActive && isNotToggleElement) {
            this.setState({ optionsMenuActive: false })
          }
        }}
      >
        <DropdownMenuItem
          closeMenu={() => {}}
          onClick={() => this.viewOnBlockExplorer()}
        >View on block explorer</DropdownMenuItem>
        <DropdownMenuItem
          closeMenu={() => {}}
          onClick={() => this.showQRCode()}
        >Show QR Code</DropdownMenuItem>
        <DropdownMenuItem
          closeMenu={() => {}}
          onClick={() => this.copyAddress()}
        >Copy address to clipboard</DropdownMenuItem>
        {ifContractAcc(keyring) ? <DropdownMenuItem
          closeMenu={() => {}}
          onClick={() => this.copyABI()}
          >Copy ABI to clipboard</DropdownMenuItem> : null}
        {isProxy ? <DropdownMenuItem
          closeMenu={() => {}}
          onClick={() => this.updateABI()}
          >Update implementation ABI</DropdownMenuItem> : null}
        {(!ifHardwareAcc(keyring) && !(ifContractAcc(keyring))) ? <DropdownMenuItem
          closeMenu={() => {}}
          onClick={() => actions.requestAccountExport()}
          >Export Private Key</DropdownMenuItem> : null}
      </Dropdown>
    )
  }

  viewOnBlockExplorer = () => {
    const { selected, network } = this.props
    const url = ethNetProps.explorerLinks.getExplorerAccountLinkFor(selected, network)
    global.platform.openWindow({ url })
  }

  showQRCode = () => {
    const { selected, identities, actions } = this.props
    const identity = identities[selected]
    actions.showQrView(selected, identity ? identity.name : '')
  }

  copyAddress = () => {
    const { selected } = this.props
    const checkSumAddress = selected && ethUtil.toChecksumAddress(selected)
    copyToClipboard(checkSumAddress)
  }

  copyABI = async () => {
    const { contractProps } = this.state
    const abi = contractProps && contractProps.abi
    copyToClipboard(JSON.stringify(abi))
  }

  updateABI = async () => {
    const { actions, selected, network } = this.props
    actions.showLoadingIndication()
    getFullABI(this.web3.eth, selected, network, importTypes.CONTRACT.PROXY)
      .then(finalABI => {
        actions.updateABI(selected, network, finalABI)
          .then()
          .catch(e => {
            log.debug(e)
          })
          .finally(() => actions.hideLoadingIndication())
      })
      .catch(e => {
        log.debug(e)
        actions.hideLoadingIndication()
      })
  }

  checkIfProxy () {
    this.ifProxyAcc()
      .then(isProxy => {
        this.setState({isProxy})
      })
  }

  ifProxyAcc () {
    const { selected } = this.props
    return new Promise((resolve, reject) => {
      this.props.actions.getContract(selected)
      .then(contractProps => {
        this.setState({contractProps})
        resolve(contractProps && contractProps.contractType === importTypes.CONTRACT.PROXY)
      })
      .catch(e => reject(e))
    })
  }

  componentDidMount () {
    this.checkIfProxy()
  }

  // switch to the first account in the list on network switch, if unlocked account was contract before change
  componentDidUpdate (prevProps) {
    const { selected } = this.props
    if (prevProps.selected !== selected) {
      this.checkIfProxy()
    }

    if (!isNaN(this.props.network)) {
      const { network } = this.props
      if (network !== prevProps.network) {
        const { keyrings, identities } = this.props
        const keyring = getCurrentKeyring(selected, this.props.network, keyrings, identities)
        const firstKeyring = keyrings && keyrings[0]
        const firstKeyRingAcc = firstKeyring && firstKeyring.accounts && firstKeyring.accounts[0]
        if (!keyring || (ifContractAcc(keyring) && firstKeyRingAcc)) {
          return this.props.actions.showAccountDetail(firstKeyRingAcc)
        }
      }
    }
  }

  render () {
    const { style, enableAccountsSelector, enableAccountOptions } = this.props
    const { optionsMenuActive, accountSelectorActive } = this.state

    const accountSelector = enableAccountsSelector && (
      <div
        className="accounts-selector accounts-selector-additional-style"
        onClick={(event) => {
          event.stopPropagation()
          this.setState({
            accountSelectorActive: !accountSelectorActive,
            optionsMenuActive: false,
          })
        }}
      >
      {this.renderAccountSelector()}
      </div>
    )
    const accountOptions = enableAccountOptions && (
      <div
        className="address-dropdown account-dropdown"
        onClick={(event) => {
          event.stopPropagation()
          this.setState({
            accountSelectorActive: false,
            optionsMenuActive: !optionsMenuActive,
          })
        }}
      >
      {this.renderAccountOptions()}
      </div>
    )
    return (
      <span style={style}>
        {accountSelector}
        {accountOptions}
      </span>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      showLoadingIndication: () => dispatch(actions.showLoadingIndication()),
      hideLoadingIndication: () => dispatch(actions.hideLoadingIndication()),
      requestAccountExport: () => dispatch(actions.requestExportAccount()),
      showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
      addNewAccount: () => dispatch(actions.addNewAccount()),
      showImportPage: () => dispatch(actions.showImportPage()),
      showConnectHWWalletPage: () => dispatch(actions.showConnectHWWalletPage()),
      showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
      getContract: (addr) => dispatch(actions.getContract(addr)),
      updateABI: (address, network, abi) => dispatch(actions.updateABI(address, network, abi)),
    },
  }
}

module.exports = {
  AccountDropdowns: connect(null, mapDispatchToProps)(AccountDropdowns),
}
