import React, { Component } from 'react'
import PropTypes from 'prop-types'
import c from 'classnames'

const debounce = require('debounce')
const copyToClipboard = require('copy-to-clipboard/index')
const ENS = require('ethjs-ens')
const networkMap = require('ethjs-ens/lib/network-map.json')
const connect = require('react-redux').connect
const log = require('loglevel')
const { isValidENSAddress } = require('../../../../helpers/utils/util')

// Local Constants
const ensRE = /.+\..+$/
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

class EnsInput extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    className: PropTypes.string,
    network: PropTypes.string,
    onChange: PropTypes.func,
  }

  state = {
    recipient: null,
    input: undefined,
    hoverText: undefined,
    ensResolution: ZERO_ADDRESS,
    nickname: undefined,
    loadingEns: false,
    ensFailure: true,
    toError: null,
    toWarning: null,
  }

  componentDidMount () {
    const network = this.props.network
    const networkHasEnsSupport = getNetworkEnsSupport(network)
    this.setState({ ensResolution: ZERO_ADDRESS })

    if (networkHasEnsSupport) {
      const provider = global.ethereumProvider
      this.ens = new ENS({ provider, network })
      this.checkName = debounce(this.lookupEnsName, 200)
    }
  }

  // If an address is sent without a nickname, meaning not from ENS or from
  // the user's own accounts, a default of a one-space string is used.
  componentDidUpdate (prevProps, prevState) {
    const {
      ensResolution,
      nickname,
      recipient,
      toError,
      toWarning,
    } = this.state
    const {
      network,
      onChange,
    } = this.props

    if (prevProps.network !== network) {
      const provider = global.ethereumProvider
      this.ens = new ENS({ provider, network })
      this.onChange(ensResolution)
    }

    if (prevState && ensResolution && onChange && ensResolution !== prevState.ensResolution) {
      onChange({
        recipient,
        toError,
        toWarning,
        toAddress: ensResolution,
        nickname: nickname || ' ',
      })
    }
  }

  lookupEnsName = (recipient) => {
    const { ensResolution } = this.state
    recipient = recipient.trim()

    log.info(`ENS attempting to resolve name: ${recipient}`)
    this.ens.lookup(recipient)
      .then((address) => {
        if (address === ZERO_ADDRESS) throw new Error(this.context.t('noAddressForName'))
        if (address !== ensResolution) {
          this.setState({
            loadingEns: false,
            ensResolution: address,
            nickname: recipient,
            hoverText: address + '\n' + this.context.t('clickCopy'),
            ensFailure: false,
            toError: null,
            recipient,
          })
        }
      })
      .catch((reason) => {
        const setStateObj = {
          loadingEns: false,
          ensResolution: recipient,
          ensFailure: true,
          toError: null,
          recipient: null,
        }
        if (isValidENSAddress(recipient) && reason.message === 'ENS name not defined.') {
          setStateObj.hoverText = this.context.t('ensNameNotFound')
          setStateObj.toError = 'ensNameNotFound'
        } else {
          log.error(reason)
          setStateObj.hoverText = reason.message
        }

        return this.setState(setStateObj)
      })
  }

  onChange = (recipient) => {
    const network = this.props.network
    const networkHasEnsSupport = getNetworkEnsSupport(network)

    this.props.onChange({ toAddress: recipient })

    if (!networkHasEnsSupport) return

    if (recipient.match(ensRE) === null) {
      return this.setState({
        loadingEns: false,
        ensResolution: null,
        ensFailure: null,
        toError: null,
        recipient,
      })
    }

    this.setState({
      loadingEns: true,
      recipient,
    })

    this.checkName(recipient)
  }

  render () {
    const { t } = this.context
    const { className } = this.props
    const { recipient, input } = this.state
    return (
      <div className={c('ens-input', className)}>
        <div className="ens-input__wrapper">
          <div
            className={c('ens-input__wrapper__status-icon', {
              'ens-input__wrapper__status-icon--error': false,
              'ens-input_-_wrapper__status-icon--valid': false,
            })}
          />
          <input
            className="ens-input__wrapper__input"
            type="text"
            placeholder={t('recipientAddress')}
            onChange={e => this.setState({ input: e.target.value })}
            value={input}
          />
          <div
            className={c('ens-input__wrapper__action-icon', {
              'ens-input__wrapper__action-icon--erase': input,
              'ens-input__wrapper__action-icon--qrcode': !input,
            })}
          />
        </div>
      </div>
    )
  }

  ensIcon (recipient) {
    const { hoverText } = this.state

    return (
      <span
        className="#ensIcon"
        title={hoverText}
        style={{
          position: 'absolute',
          top: '16px',
          left: '-25px',
        }}
      >
        { this.ensIconContents(recipient) }
      </span>
    )
  }

  ensIconContents () {
    const { loadingEns, ensFailure, ensResolution, toError } = this.state || { ensResolution: ZERO_ADDRESS }

    if (toError) return

    if (loadingEns) {
      return (
        <img
          src="images/loading.svg"
          style={{
            width: '30px',
            height: '30px',
            transform: 'translateY(-6px)',
          }}
        />
      )
    }

    if (ensFailure) {
      return <i className="fa fa-warning fa-lg warning'" />
    }

    if (ensResolution && (ensResolution !== ZERO_ADDRESS)) {
      return (
        <i
          className="fa fa-check-circle fa-lg cursor-pointer"
          style={{ color: 'green' }}
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            copyToClipboard(ensResolution)
          }}
        />
      )
    }
  }
}

export default connect()(EnsInput)

function getNetworkEnsSupport (network) {
  return Boolean(networkMap[network])
}
