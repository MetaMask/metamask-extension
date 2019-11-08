import React, { Component } from 'react'
import PropTypes from 'prop-types'
import c from 'classnames'
import { isValidAddress } from '../../../../helpers/utils/util'
import {ellipsify} from '../../send.utils'
import { Namicorn, ResolutionError } from 'namicorn'

import debounce from 'debounce'
import copyToClipboard from 'copy-to-clipboard/index'

// Local Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default class NamingInput extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    className: PropTypes.string,
    network: PropTypes.string,
    selectedAddress: PropTypes.string,
    selectedName: PropTypes.string,
    onChange: PropTypes.func,
    updateSendTo: PropTypes.func,
    updateNamingResolution: PropTypes.func,
    scanQrCode: PropTypes.func,
    updateNamingResolutionError: PropTypes.func,
    onPaste: PropTypes.func,
    onReset: PropTypes.func,
    contact: PropTypes.object,
    selectedToken: PropTypes.object,
  }

  state = {
    recipient: null,
    input: '',
    toError: null,
    toWarning: null,
  }

  componentDidMount () {
    const network = this.props.network
    this.namicorn = new Namicorn({blockchain: {ens: {network: parseInt(network)}, zns: true}})
    const networkHasEnsSupport = this.namicorn.ens.isSupportedNetwork()
    this.setState({ namingResolution: ZERO_ADDRESS })

    if (networkHasEnsSupport) { this.checkName = debounce(this.lookupDomain, 200) }

  }

  // If an address is sent without a nickname, meaning not from ENS or from
  // the user's own accounts, a default of a one-space string is used.
  componentDidUpdate (prevProps) {
    const {
      input,
    } = this.state
    const {
      network,
    } = this.props

    if (prevProps.network !== network) {
      this.namicorn = new Namicorn({blockchain: {ens: {network: parseInt(network)}, zns: true}})
      this.onChange({ target: { value: input } })
    }
  }

  resetInput = () => {
    const { updateNamingResolution, updateNamingResolutionError, onReset } = this.props
    this.onChange({ target: { value: '' } })
    onReset()
    updateNamingResolution('')
    updateNamingResolutionError('')
  }

  lookupDomain = async (domain) => {
    domain = domain.trim()
    this.namicorn.addressOrThrow(domain, this.props.selectedToken || 'ETH')
      .then((address) => { this.props.updateNamingResolution(address) })
      .catch((reason) => {
        var message = reason.message
        if (reason instanceof ResolutionError) {
          switch (reason.code) {
            case 'UnregisteredDomain':
              message = this.context.t('noOwnerForName')
              break
            case 'UnspecifiedCurrency':
              message = this.context.t('noAddressForName')
              break
            case 'UnsupportedDomain':
              message = this.context.t('invalidDomain')
              break
            default:
              message = reason.message
              break
          }
        }
        this.props.updateNamingResolutionError(message)
      })
  }

  onPaste = event => {
    event.clipboardData.items[0].getAsString(text => {
      if (isValidAddress(text)) {
        this.props.onPaste(text)
      }
    })
  }

  onChange = e => {
    const { onChange, updateNamingResolution, updateNamingResolutionError } = this.props
    const input = e.target.value

    this.setState({ input }, () => onChange(input))
    if (input === '') {
      updateNamingResolution('')
      updateNamingResolutionError('')
      return
    }
    this.lookupDomain(input)
  }


  render () {
    const { t } = this.context
    const { className, selectedAddress } = this.props
    const { input } = this.state

    if (selectedAddress) {
      return this.renderSelected()
    }

    return (
      <div className={c('ens-input', className)}>
        <div
          className={c('ens-input__wrapper', {
            'ens-input__wrapper__status-icon--error': false,
            'ens-input__wrapper__status-icon--valid': false,
          })}
        >
          <div className="ens-input__wrapper__status-icon" />
          <input
            className="ens-input__wrapper__input"
            type="text"
            dir="auto"
            placeholder={t('recipientAddressPlaceholder')}
            onChange={this.onChange}
            onPaste={this.onPaste}
            value={selectedAddress || input}
            autoFocus
          />
          <div
            className={c('ens-input__wrapper__action-icon', {
              'ens-input__wrapper__action-icon--erase': input,
              'ens-input__wrapper__action-icon--qrcode': !input,
            })}
            onClick={() => {
              if (input) {
                this.resetInput()
              } else {
                this.props.scanQrCode()
              }
            }}
          />
        </div>
      </div>
    )
  }

  renderSelected () {
    const { t } = this.context
    const { className, selectedAddress, selectedName, contact = {} } = this.props
    const name = contact.name || selectedName


    return (
      <div className={c('ens-input', className)}>
        <div
          className="ens-input__wrapper ens-input__wrapper--valid"
        >
          <div className="ens-input__wrapper__status-icon ens-input__wrapper__status-icon--valid" />
          <div
            className="ens-input__wrapper__input ens-input__wrapper__input--selected"
            placeholder={t('recipientAddress')}
            onChange={this.onChange}
          >
            <div className="ens-input__selected-input__title">
              {name || ellipsify(selectedAddress)}
            </div>
            { name && <div className="ens-input__selected-input__subtitle">{selectedAddress}</div> }
          </div>
          <div
            className="ens-input__wrapper__action-icon ens-input__wrapper__action-icon--erase"
            onClick={this.resetInput}
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
    const { loadingEns, ensFailure, namingResolution, toError } = this.state || { namingResolution: ZERO_ADDRESS }

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

    if (namingResolution && (namingResolution !== ZERO_ADDRESS)) {
      return (
        <i
          className="fa fa-check-circle fa-lg cursor-pointer"
          style={{ color: 'green' }}
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            copyToClipboard(namingResolution)
          }}
        />
      )
    }
  }
}
