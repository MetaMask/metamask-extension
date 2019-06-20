import React, { Component } from 'react'
import PropTypes from 'prop-types'
import c from 'classnames'
import {getCurrentNetwork, getSendTo, getSendToNickname} from '../../send.selectors'
import { isValidENSAddress, isValidAddress } from '../../../../helpers/utils/util'
import {
  updateSendTo,
  updateEnsResolution,
  updateEnsResolutionError,
} from '../../../../store/actions'

const debounce = require('debounce')
const copyToClipboard = require('copy-to-clipboard/index')
const ENS = require('ethjs-ens')
const networkMap = require('ethjs-ens/lib/network-map.json')
const connect = require('react-redux').connect
const log = require('loglevel')


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
    selectedAddress: PropTypes.string,
    selectedName: PropTypes.string,
    resetRecipient: PropTypes.func,
    onChange: PropTypes.func,
    updateSendTo: PropTypes.func,
    updateEnsResolution: PropTypes.func,
  }

  state = {
    recipient: null,
    input: '',
    // hoverText: undefined,
    // ensResolution: ZERO_ADDRESS,
    // nickname: undefined,
    // loadingEns: false,
    // ensFailure: false,
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
      // ensResolution,
      // nickname,
      // recipient,
      // toError,
      // toWarning,
      input,
    } = this.state
    const {
      network,
      // onChange,
    } = this.props

    if (prevProps.network !== network) {
      const provider = global.ethereumProvider
      this.ens = new ENS({ provider, network })
      this.onChange({ target: { value: input } })
    }

    // if (prevState && ensResolution && onChange && ensResolution !== prevState.ensResolution) {
    //   onChange({
    //     recipient,
    //     toError,
    //     toWarning,
    //     toAddress: ensResolution,
    //     nickname: nickname || ' ',
    //   })
    // }
  }

  lookupEnsName = (recipient) => {
    // const { ensResolution } = this.state
    recipient = recipient.trim()

    log.info(`ENS attempting to resolve name: ${recipient}`)
    this.ens.lookup(recipient)
      .then((address) => {
        if (address === ZERO_ADDRESS) throw new Error(this.context.t('noAddressForName'))
        this.props.updateEnsResolution(address)
      })
      .catch((reason) => {
        if (isValidENSAddress(recipient) && reason.message === 'ENS name not defined.') {
          updateEnsResolutionError(reason.message)
        } else {
          log.error(reason)
          updateEnsResolutionError(reason.message)
        }
      })
  }

  onChange = e => {
    const { network, onChange } = this.props
    const input = e.target.value
    const networkHasEnsSupport = getNetworkEnsSupport(network)

    this.setState({ input }, () => onChange(input))

    if (isValidAddress(input)) {
      // set icon to valid
      // advance to next step
      return
    }

    // maybe scan ENS
    if (!networkHasEnsSupport) return

    if (isValidENSAddress(input)) {
      this.lookupEnsName(input)
      // Show loading
      // scan ENS
      // If success
      //    stop loading
      //    show ENS name as clickable item
      // If error
      //    stop loading
      //    show error message
    } else {
      // do nothing
      // return this.setState({
      //   loadingEns: false,
      //   ensResolution: null,
      //   ensFailure: null,
      //   toError: null,
      //   recipient,
      // })
    }

    // this.setState({
    //   loadingEns: true,
    //   recipient,
    // })
    //
    // this.checkName(recipient)
  }

  render () {
    const { t } = this.context
    const { className, onChange, selectedAddress, updateSendTo } = this.props
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
            placeholder={t('recipientAddress')}
            onChange={this.onChange}
            value={selectedAddress || input}
          />
          <div
            className={c('ens-input__wrapper__action-icon', {
              'ens-input__wrapper__action-icon--erase': input,
              'ens-input__wrapper__action-icon--qrcode': !input,
            })}
            onClick={() => {
              if (input) {
                this.setState({ input: '' }, () => {
                  onChange('')
                  updateSendTo('', '')
                })
              } else {
                console.log('Scan QR!')
              }
            }}
          />
        </div>
      </div>
    )
  }

  renderSelected () {
    const { t } = this.context
    const { className, onChange, selectedAddress, selectedName, updateSendTo } = this.props

    return (
      <div className={c('ens-input', className)}>
        <div
          className="ens-input__wrapper ens-input__wrapper--valid"
        >
          <div className="ens-input__wrapper__status-icon" />
          <div
            className="ens-input__wrapper__input ens-input__wrapper__input--selected"
            placeholder={t('recipientAddress')}
            onChange={this.onChange}
          >
            <div className="ens-input__selected-input__title">
              {selectedName || selectedAddress}
            </div>
            {
              selectedName && (
                <div
                  className="ens-input__selected-input__subtitle"
                >
                  {selectedAddress}
                </div>
              )
            }
          </div>
          <div
            className="ens-input__wrapper__action-icon ens-input__wrapper__action-icon--erase"
            onClick={() => {
              this.setState({ input: '' }, () => {
                onChange('')
                updateSendTo('', '')
              })
            }}
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

export default connect(
  state => ({
    network: getCurrentNetwork(state),
    selectedAddress: getSendTo(state),
    selectedName: getSendToNickname(state),
  }),
  dispatch => ({
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    updateEnsResolution: (ensResolution) => dispatch(updateEnsResolution(ensResolution)),
  })
)(EnsInput)

function getNetworkEnsSupport (network) {
  return Boolean(networkMap[network])
}

function ellipsify (text, first = 6, last = 4) {
  return `${text.slice(0, first)}...${text.slice(-last)}`
}
