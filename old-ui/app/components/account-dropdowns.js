import React, { Component } from 'react'
import PropTypes from 'prop-types'
import actions from '../../../ui/app/actions'
import { connect } from 'react-redux'
import { Dropdown, DropdownMenuItem } from './dropdown'
import Identicon from './identicon'
import ethUtil from 'ethereumjs-util'
import copyToClipboard from 'copy-to-clipboard'
import ethNetProps from 'eth-net-props'
import { getCurrentKeyring, ifLooseAcc, ifContractAcc, ifHardwareAcc } from '../util'
import { getHdPaths, isLedger } from './connect-hardware/util'
import { LEDGER } from './connect-hardware/enum'
import { importTypes, labels } from '../accounts/import/enums'
import { getFullABI } from '../accounts/import/helpers'
import log from 'loglevel'
import Web3 from 'web3'

class AccountsDropdownMenuItemWrapper extends DropdownMenuItem {
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
  constructor (props) {
    super(props)
    const web3 = new Web3(global.ethereumProvider)
    this.state = {
      accountSelectorActive: false,
      optionsMenuActive: false,
      web3,
      labels: {},
      isProxy: false,
      contractProps: null,
    }
    this.accountSelectorToggleClassName = 'accounts-selector'
    this.optionsMenuToggleClassName = 'account-dropdown'
  }

  renderAccounts () {
      const { identities, selected, keyrings, network } = this.props
      const accountOrder = this.getAccounts()

      const accountsViews = accountOrder.map((address, index) => {
        const identity = identities[address]
        if (!identity) {
          return null
        }
        const isSelected = identity.address === selected

        const keyring = getCurrentKeyring(address, network, keyrings, identities)

        // display contract acc only for network where it was created
        if (ifContractAcc(keyring)) {
          if (keyring.network !== network) {
            return null
          } else {
            return this.accountsDropdownItemView(index, isSelected, keyring, identity)
          }
        } else {
          return this.accountsDropdownItemView(index, isSelected, keyring, identity)
        }
      })
      return accountsViews
  }

  accountsDropdownItemView (index, isSelected, keyring, identity) {
    const { labels } = this.state
    const { address, name } = identity
    const leftBorder = isSelected ? <div className="accs-dd-menu-item-selected" /> : null
    const accountIcon = (
      <Identicon
        overflow="none"
        address={identity.address}
        diameter={24}
        style={{ marginLeft: '10px' }}
      />
    )
    const accountName = (
      <span
        className="accs-dd-menu-item-account-name"
        style={{ color: isSelected ? 'white' : '' }}
      >{name || ''}
      </span>
    )
    const accountLabel = labels[address] ? <div className="keyring-label">{labels[address]}</div> : null
    const removeIcon = ifLooseAcc(keyring) ? (
      <div
        className="remove"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          this.props.actions.showDeleteImportedAccount(identity)
          this.setState({
            accountSelectorActive: false,
            optionsMenuActive: false,
          })
        }}
      />) : null
    return (
      <DropdownMenuItem
        key={`account_${index}`}
        closeMenu={() => {}}
        onClick={() => this.accountOnClick(keyring, address)}
        style={{
          marginTop: index === 0 ? '5px' : '',
          fontSize: '16px',
          padding: '8px 0px',
        }}
      >
        {leftBorder}
        {accountIcon}
        {accountName}
        {accountLabel}
        {removeIcon}
      </DropdownMenuItem>
    )
  }

  accountOnClick (keyring, address) {
    this.props.actions.showAccountDetail(address)
    if (ifHardwareAcc(keyring)) {
      if (isLedger(keyring.type)) {
        const hdPaths = getHdPaths()
        return new Promise((resolve, reject) => {
          this.props.actions.connectHardwareAndUnlockAddress(LEDGER, hdPaths[1].value, address)
          .then(_ => resolve())
          .catch(e => {
            this.props.actions.connectHardwareAndUnlockAddress(LEDGER, hdPaths[0].value, address)
            .then(_ => resolve())
            .catch(e => reject(e))
          })
        })
        .catch(e => {
          this.props.actions.displayWarning((e && e.message) || e)
          this.props.actions.displayToast(e)
        })
      }
    }
  }

  ifProxyAcc (address, setProxy) {
    return new Promise((resolve, reject) => {
      this.props.actions.getContract(address)
      .then(contractProps => {
        if (setProxy) {
          this.setState({contractProps})
        }
        resolve(contractProps && contractProps.contractType === importTypes.CONTRACT.PROXY)
      })
      .catch(e => reject(e))
    })
  }

  setLabel (keyring, address) {
    if (ifLooseAcc(keyring)) {
      let label
      if (ifContractAcc(keyring)) {
        const setProxy = false
        this.ifProxyAcc(address, setProxy)
          .then(isProxy => {
            label = isProxy ? labels.PROXY : labels.CONTRACT
            this.setLabelToState(label, address)
          })
      } else if (ifHardwareAcc(keyring)) {
        label = labels.HARDWARE
        this.setLabelToState(label, address)
      } else {
        label = labels.IMPORTED
        this.setLabelToState(label, address)
      }
    }
  }

  setLabelToState (label, address) {
    const labelsArr = this.state.labels
    labelsArr[address] = label
    this.setState({labelsArr})
  }

  renderAccountSelector () {
    const { actions } = this.props
    const { accountSelectorActive } = this.state
    let menuItems = []
    menuItems = Object.assign(menuItems, this.renderAccounts())
    const bottomMenuItems = [
      <AccountsDropdownMenuItemWrapper key="AccountsDropdownMenuItemAdd" onClick={() => actions.addNewAccount()} label="Create Account" />,
      <AccountsDropdownMenuItemWrapper key="AccountsDropdownMenuItemImport" onClick={() => actions.showImportPage()} label="Import Account" />,
      <AccountsDropdownMenuItemWrapper key="AccountsDropdownMenuItemConnectHD" onClick={() => actions.showConnectHWWalletPage()} label="Connect hardware wallet" />,
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
    const { web3 } = this.state
    actions.showLoadingIndication()
    getFullABI(web3.eth, selected, network, importTypes.CONTRACT.PROXY)
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

  getAccounts () {
    const { keyrings, network } = this.props
    const accountOrder = keyrings.reduce((list, keyring) => {
      if (ifContractAcc(keyring) && keyring.network === network) {
        list = list.concat(keyring.accounts)
      } else if (!ifContractAcc(keyring)) {
        list = list.concat(keyring.accounts)
      }
      return list
    }, [])
    return accountOrder
  }

  checkIfProxy () {
    const { selected } = this.props
    const setProxy = true
    this.ifProxyAcc(selected, setProxy)
      .then(isProxy => {
        this.setState({isProxy})
      })
  }

  setAllLabels () {
    const { identities, keyrings, network } = this.props
    const accountOrder = this.getAccounts()

    accountOrder.forEach((address) => {
      const keyring = getCurrentKeyring(address, network, keyrings, identities)
      this.setLabel(keyring, address)
    })
  }

  componentDidMount () {
    this.setAllLabels()
    this.checkIfProxy()
  }

  // switch to the first account in the list on network switch, if unlocked account was contract before change
  componentDidUpdate (prevProps) {
    const { selected, keyrings } = this.props
    if (prevProps.selected !== selected) {
      this.checkIfProxy()
    }
    if (prevProps.keyrings.length !== keyrings.length) {
      this.setAllLabels()
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
        this.setAllLabels()
      }
    }
  }
}

AccountDropdowns.defaultProps = {
  enableAccountsSelector: false,
  enableAccountOptions: false,
}

AccountDropdowns.propTypes = {
  identities: PropTypes.objectOf(PropTypes.object),
  selected: PropTypes.string,
  keyrings: PropTypes.array,
  actions: PropTypes.objectOf(PropTypes.func),
  network: PropTypes.string,
  style: PropTypes.object,
  enableAccountOptions: PropTypes.bool,
  enableAccountsSelector: PropTypes.bool,
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      showLoadingIndication: () => dispatch(actions.showLoadingIndication()),
      hideLoadingIndication: () => dispatch(actions.hideLoadingIndication()),
      showConfigPage: () => dispatch(actions.showConfigPage()),
      requestAccountExport: () => dispatch(actions.requestExportAccount()),
      showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
      addNewAccount: () => dispatch(actions.addNewAccount()),
      showImportPage: () => dispatch(actions.showImportPage()),
      showConnectHWWalletPage: () => dispatch(actions.showConnectHWWalletPage()),
      showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
      showDeleteImportedAccount: (identity) => dispatch(actions.showDeleteImportedAccount(identity)),
      displayWarning: (msg) => dispatch(actions.displayWarning(msg)),
      getContract: (addr) => dispatch(actions.getContract(addr)),
      setHardwareWalletDefaultHdPath: ({device, path}) => {
        return dispatch(actions.setHardwareWalletDefaultHdPath({device, path}))
      },
      connectHardwareAndUnlockAddress: (deviceName, hdPath, address) => {
        return dispatch(actions.connectHardwareAndUnlockAddress(deviceName, hdPath, address))
      },
      displayToast: (msg) => dispatch(actions.displayToast(msg)),
      hideToast: () => dispatch(actions.hideToast()),
      updateABI: (address, network, abi) => dispatch(actions.updateABI(address, network, abi)),
    },
  }
}

module.exports = {
  AccountDropdowns: connect(null, mapDispatchToProps)(AccountDropdowns),
}
