import React, { Component } from 'react'
import PropTypes from 'prop-types'
import actions from '../../../../ui/app/actions'
import { connect } from 'react-redux'
import { DropdownMenuItem } from '../dropdown'
import Identicon from '../identicon'
import { ifLooseAcc, ifContractAcc, ifHardwareAcc } from '../../util'
import { getHdPaths, isLedger } from '../connect-hardware/util'
import { LEDGER } from '../connect-hardware/enum'
import { importTypes, labels } from '../../accounts/import/enums'

class AccountsDropdownItemView extends Component {
  static propTypes = {
    isSelected: PropTypes.bool,
    keyring: PropTypes.object.isRequired,
    identity: PropTypes.object.isRequired,
    actions: PropTypes.objectOf(PropTypes.func),
    closeMenu: PropTypes.func,
  }

  constructor (props) {
    super(props)
    this.state = {
      label: '',
      preventToast: false,
    }
  }

  render () {
    const { isSelected, keyring, identity } = this.props
    const { label } = this.state
    const { address, name } = identity
    const leftBorder = isSelected ? <div className="accs-dd-menu-item-selected" /> : null
    const accountIcon = (
      <Identicon
        overflow="none"
        address={address}
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
    const accountLabel = label ? <div className="keyring-label">{label}</div> : null
    const removeIcon = ifLooseAcc(keyring) ? (
      <div
        className="remove"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          this.props.actions.showDeleteImportedAccount(identity)
          this.props.closeMenu()
        }}
      />) : null
    return (
      <DropdownMenuItem
        closeMenu={() => {}}
        onClick={() => this.accountOnClick(keyring, address)}
        style={{
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

  componentDidMount () {
    this.setLabel()
  }

  setLabel () {
    const { keyring, identity: {address} } = this.props
    if (ifLooseAcc(keyring)) {
      let label
      if (ifContractAcc(keyring)) {
        const setProxy = false
        this.ifProxyAcc(address, setProxy)
          .then(isProxy => {
            label = isProxy ? labels.PROXY : labels.CONTRACT
            this.setLabelToState(label)
          })
      } else if (ifHardwareAcc(keyring)) {
        label = labels.HARDWARE
        this.setLabelToState(label)
      } else {
        label = labels.IMPORTED
        this.setLabelToState(label)
      }
    }
  }

  ifProxyAcc (address, setProxy) {
    return new Promise((resolve, reject) => {
      this.props.actions.getContract(address)
      .then(contractProps => {
        resolve(contractProps && contractProps.contractType === importTypes.CONTRACT.PROXY)
      })
      .catch(e => reject(e))
    })
  }

  setLabelToState (label) {
    this.setState({ label })
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
          if (!this.state.preventToast) {
            this.props.actions.displayToast(e)
          } else {
            this.allowToast()
          }
        })
      } else {
        this.preventToast()
      }
    } else {
        this.preventToast()
    }
  }

  allowToast () {
    this.setState({ preventToast: false })
  }

  preventToast () {
    this.setState({ preventToast: true })
  }
}


const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
      showDeleteImportedAccount: (identity) => dispatch(actions.showDeleteImportedAccount(identity)),
      getContract: (addr) => dispatch(actions.getContract(addr)),
      connectHardwareAndUnlockAddress: (deviceName, hdPath, address) => {
        return dispatch(actions.connectHardwareAndUnlockAddress(deviceName, hdPath, address))
      },
      displayToast: (msg) => dispatch(actions.displayToast(msg)),
    },
  }
}

module.exports = {
  AccountsDropdownItemView: connect(null, mapDispatchToProps)(AccountsDropdownItemView),
}
