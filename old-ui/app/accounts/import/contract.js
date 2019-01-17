import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import actions from '../../../../ui/app/actions'
import Web3 from 'web3'
import log from 'loglevel'
import copyToClipboard from 'copy-to-clipboard'
import { importTypes } from './enums'

class ContractImportView extends Component {
  constructor (props) {
    super(props)

    const web3 = new Web3(global.ethereumProvider)
    this.state = {
      contractAddr: '',
      abi: '',
      abiInputDisabled: false,
      importDisabled: true,
      web3,
    }
  }

  static propTypes = {
    error: PropTypes.string,
    network: PropTypes.string,
    type: PropTypes.string,
    displayWarning: PropTypes.func,
    importNewAccount: PropTypes.func,
    hideWarning: PropTypes.func,
    showLoadingIndication: PropTypes.func,
    hideLoadingIndication: PropTypes.func,
  }

  addressOnChange (contractAddr) {
    this.setState({
      contractAddr,
    }, () => {
      this.autodetectContractAbi()
    })
  }

  abiOnChange (abi) {
    this.props.hideWarning()
    try {
      if (abi) {
        this.setState({
          abi: JSON.stringify(abi),
          abiInputDisabled: true,
          importDisabled: false,
        })
      }
    } catch (e) {
      this.clearAbi()
      log.debug('ABI can not be parsed')
    }
  }

  render () {
    const { error } = this.props

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '5px 0px 0px 0px',
      }}>
        <span>Paste address of contract here</span>
        <input
          className="large-input"
          id="address-box"
          value={this.state.contractAddr}
          onChange={(e) => this.addressOnChange(e.target.value)}
          style={{
            width: '100%',
            marginTop: '12px',
          }}
        />
        <span style={{ marginTop: '20px' }}>Paste ABI of contract here
          <i
            className="clipboard cursor-pointer"
            style={{ marginLeft: '10px' }}
            onClick={(e) => { copyToClipboard(this.state.abi) }}
          />
        </span>
        <textarea
          id="abi-box"
          disabled={this.state.abiInputDisabled}
          value={this.state.abi}
          onChange={(e) => this.abiOnChange(e.target.value) }
          style={{
            marginTop: '12px',
            width: '100%',
            height: '50px',
          }}
          onKeyPress={(e) => this.createKeyringOnEnter(e)}
        />
        <button
          disabled={this.state.importDisabled}
          onClick={(e) => this.createNewKeychain(e)}
          style={{ margin: '20px' }}
        >Import</button>
        {error ? <span className="error">{error}</span> : null}
      </div>
    )
  }

  autodetectContractAbi = () => {
    const { contractAddr, web3 } = this.state
    const { type } = this.props
    if (!contractAddr || !web3.isAddress(contractAddr)) {
      this.clearAbi()
      return
    }
    this.getABI(contractAddr)
      .then((targetABI) => {
        targetABI = targetABI && JSON.parse(targetABI)
        let finalABI = targetABI
        if (type === importTypes.CONTRACT.PROXY) {
          try {
            web3.eth.contract(targetABI).at(contractAddr).implementation.call((err, implAddr) => {
              this.getABI(implAddr)
                .then((implABI) => {
                  implABI = implABI && JSON.parse(implABI)
                  finalABI = implABI ? targetABI.concat(implABI) : targetABI
                  this.abiOnChange(finalABI)
                })
                .catch(e => log.debug(e))
            })
          } catch (e) {
            log.debug(e)
          }
        } else {
          this.abiOnChange(finalABI)
        }
      })
      .catch(e => {
        this.clearAbi()
        log.debug(e)
      })
  }

  getABI = (addr) => {
    return new Promise((resolve, reject) => {
      const networkName = this.getBlockscoutApiNetworkSuffix()
      const bloscoutApiLink = `https://blockscout.com/poa/${networkName}/api`
      const bloscoutApiContractPath = '?module=contract'
      const blockscoutApiGetAbiPath = `&action=getabi&address=${addr}`
      const apiLink = `${bloscoutApiLink}${bloscoutApiContractPath}${blockscoutApiGetAbiPath}`
      fetch(apiLink)
        .then(response => {
          return response.json()
        })
        .then(responseJson => {
          resolve(responseJson && responseJson.result)
        })
        .catch((e) => {
          log.debug(e)
          resolve()
        })
    })
  }

  createKeyringOnEnter (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.createNewKeychain()
    }
  }

  async getContractCode () {
    this.props.showLoadingIndication()
    const { contractAddr, web3 } = this.state
    return new Promise((resolve, reject) => {
      web3.eth.getCode(contractAddr, (err, addrCode) => {
        if (err) {
          reject(err)
        } else {
          resolve(addrCode)
        }
        this.props.hideLoadingIndication()
      })
    })
  }

  async createNewKeychain () {
    const { contractAddr, web3 } = this.state

    if (!contractAddr || !web3.isAddress(contractAddr)) {
      this.clearAbi()
      return this.props.displayWarning('Invalid contract address')
    }

    const contractAddrCode = await this.getContractCode()
    if (contractAddrCode === '0x') {
      this.clearAbi()
      return this.props.displayWarning('This is not a contract address')
    }

    let abi
    try {
      abi = JSON.parse(this.state.abi)
    } catch (e) {
      this.clearAbi()
      this.props.displayWarning('Invalid ABI')
    }

    if (!abi) {
      this.clearAbi()
      return this.props.displayWarning('Invalid contract ABI')
    }

    this.props.importNewAccount('Contract', { addr: contractAddr, network: this.props.network, abi })
    // JS runtime requires caught rejections but failures are handled by Redux
    .catch()
  }

  getBlockscoutApiNetworkSuffix () {
    const { network } = this.props
    switch (Number(network)) {
      case 1:
        return 'mainnet'
      case 99:
        return 'core'
      case 77:
        return 'sokol'
      case 100:
        return 'dai'
      case 42:
        return 'kovan'
      case 3:
        return 'ropsten'
      case 4:
        return 'rinkeby'
      default:
        return ''
    }
  }

  clearAbi () {
    this.setState({
      abi: '',
      abiInputDisabled: false,
      importDisabled: true,
    })
  }

}

function mapStateToProps (state) {
  const warning = state.appState.warning
  const result = {
    error: warning && (warning || warning.message),
    network: state.metamask.network,
  }

  return result
}

function mapDispatchToProps (dispatch) {
  return {
    showLoadingIndication: () => dispatch(actions.showLoadingIndication()),
    hideLoadingIndication: () => dispatch(actions.hideLoadingIndication()),
    hideWarning: () => dispatch(actions.hideWarning()),
    displayWarning: (msg) => dispatch(actions.displayWarning(msg)),
    importNewAccount: (strategy, args) => dispatch(actions.importNewAccount(strategy, args)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ContractImportView)
