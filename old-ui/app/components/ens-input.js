import { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'debounce'
import copyToClipboard from 'copy-to-clipboard'
import ENS from 'ethjs-ens'
import log from 'loglevel'

const h = require('react-hyperscript')
const networkMap = require('ethjs-ens/lib/network-map.json')
const RNSRegistryData = require('@rsksmart/rns-registry/RNSRegistryData.json')
const ensRE = /.+\..+$/
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const { isValidENSAddress, isValidRNSAddress } = require('../util')
const {
  RSK_CODE,
  RSK_TESTNET_CODE,
} = require('../../../app/scripts/controllers/network/enums')

class EnsInput extends Component {
  static propTypes = {
    network: PropTypes.string,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    name: PropTypes.string,
    identities: PropTypes.object,
    addressBook: PropTypes.array,
    updateSendTo: PropTypes.func,
  }

  render () {
    const props = this.props

    function onInputChange () {
      const recipient = document.querySelector('input[name="address"]').value
      this.props.updateSendTo(recipient, ' ')
      const network = this.props.network
      const networkHasEnsSupport = getNetworkEnsSupport(network)
      const networkHasRnsSupport = getNetworkRnsSupport(network)
      if (!networkHasEnsSupport && !networkHasRnsSupport) return

      if (recipient.match(ensRE) === null) {
        return this.setState({
          loadingEns: false,
          ensResolution: null,
          ensFailure: null,
          toError: null,
        })
      }

      this.setState({
        loadingEns: true,
      })
      this.checkName()
    }

    return (
      h('div', {
        style: { width: '100%' },
      }, [
        h('input.large-input', {
          name: props.name,
          placeholder: props.placeholder,
          list: 'addresses',
          onChange: onInputChange.bind(this),
        }),
        // The address book functionality.
        h('datalist#addresses',
          [
            // Corresponds to the addresses owned.
            Object.keys(props.identities).map((key) => {
              const identity = props.identities[key]
              return h('option', {
                value: identity.address,
                label: identity.name,
                key: identity.address,
              })
            }),
            // Corresponds to previously sent-to addresses.
            props.addressBook.map((identity) => {
              return h('option', {
                value: identity.address,
                label: identity.name,
                key: identity.address,
              })
            }),
          ]),
        this.ensIcon(),
      ])
    )
  }

  componentDidMount () {
    const network = this.props.network
    const networkHasEnsSupport = getNetworkEnsSupport(network)
    const networkHasRnsSupport = getNetworkRnsSupport(network)

    this.setState({ ensResolution: ZERO_ADDRESS })

    if (networkHasEnsSupport) {
      const provider = global.ethereumProvider
      this.ens = new ENS({ provider, network })
      this.checkName = debounce(this.lookupEnsName.bind(this, 'ENS'), 200)
    } else if (networkHasRnsSupport) {
      const registryAddress = getRnsRegistryAddress(network)
      const provider = global.ethereumProvider
      this.ens = new ENS({ provider, network, registryAddress })
      this.checkName = debounce(this.lookupEnsName.bind(this, 'RNS'), 200)
    }
  }

  lookupEnsName (nameService) {
    const recipient = document.querySelector('input[name="address"]').value
    const { ensResolution } = this.state

    log.info(`${nameService} attempting to resolve name: ${recipient}`)
    this.ens.lookup(recipient.trim())
    .then((address) => {
      if (address === ZERO_ADDRESS) throw new Error('No address has been set for this name.')
      if (address !== ensResolution) {
        this.setState({
          loadingEns: false,
          ensResolution: address,
          nickname: recipient.trim(),
          hoverText: address + '\nClick to Copy',
          ensFailure: false,
          toError: null,
        })
      }
    })
    .catch((reason) => {
      const setStateObj = {
        loadingEns: false,
        ensResolution: recipient,
        ensFailure: true,
        toError: null,
      }
      if (
        (isValidENSAddress(recipient) || isValidRNSAddress(recipient)) &&
        reason.message === 'ENS name not defined.'
      ) {
        setStateObj.hoverText = '${nameService} name not found'
        setStateObj.toError = `${nameService.toLowerCase()}NameNotFound`
        setStateObj.ensFailure = false
      } else {
        log.error(reason)
        setStateObj.hoverText = reason.message
      }

      return this.setState(setStateObj)
    })
  }

  componentDidUpdate (prevProps, prevState) {
    const state = this.state || {}
    const ensResolution = state.ensResolution
    // If an address is sent without a nickname, meaning not from ENS or from
    // the user's own accounts, a default of a one-space string is used.
    const nickname = state.nickname || ' '
    if (prevState && ensResolution && this.props.onChange &&
        ensResolution !== prevState.ensResolution) {
      this.props.onChange({ toAddress: ensResolution, nickname, toError: state.toError, toWarning: state.toWarning })
    }
  }

  ensIcon () {
    const { hoverText } = this.state || {}
    return h('span', {
      title: hoverText,
      style: {
        position: 'absolute',
        padding: '6px 0px',
        right: '0px',
        transform: 'translatex(-40px)',
      },
    }, this.ensIconContents())
  }

  ensIconContents () {
    const { loadingEns, ensFailure, ensResolution, toError } = this.state || { ensResolution: ZERO_ADDRESS}

    if (toError) return

    if (loadingEns) {
      return h('img', {
        src: 'images/loading.svg',
        style: {
          width: '30px',
          height: '30px',
          transform: 'translateY(-6px)',
          marginRight: '-5px',
        },
      })
    }

    if (ensFailure) {
      return h('i.fa.fa-warning.fa-lg.warning', {
        style: {
          color: '#df2265',
          background: 'white',
        },
      })
    }

    if (ensResolution && (ensResolution !== ZERO_ADDRESS)) {
      return h('i.fa.fa-check-circle.fa-lg.cursor-pointer', {
        style: {
          color: '#60db97',
          background: 'white',
        },
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          copyToClipboard(ensResolution)
        },
      })
    }
  }
}

function getNetworkEnsSupport (network) {
  return Boolean(networkMap[network])
}

function getNetworkRnsSupport (network) {
  network = parseInt(network, 10)
  return (network === RSK_CODE || network === RSK_TESTNET_CODE)
}

function getRnsRegistryAddress (network) {
  network = parseInt(network, 10)
  if (network === RSK_CODE) {
    return RNSRegistryData.address.rskMainnet
  }

  if (network === RSK_TESTNET_CODE) {
    return RNSRegistryData.address.rskTestnet
  };

  return
}

module.exports = EnsInput
