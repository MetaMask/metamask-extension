const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const extend = require('xtend')
const debounce = require('debounce')
const copyToClipboard = require('copy-to-clipboard')
const ENS = require('ethjs-ens')
const networkMap = require('ethjs-ens/lib/network-map.json')
const ensRE = /.+\..+$/
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const connect = require('react-redux').connect
const ToAutoComplete = require('./send/to-autocomplete').default
const log = require('loglevel')
const { isValidENSAddress } = require('../util')

EnsInput.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(EnsInput)


inherits(EnsInput, Component)
function EnsInput () {
  Component.call(this)
}

EnsInput.prototype.onChange = function (recipient) {
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
    })
  }

  this.setState({
    loadingEns: true,
  })
  this.checkName(recipient)
}

EnsInput.prototype.render = function () {
  const props = this.props
  const opts = extend(props, {
    list: 'addresses',
    onChange: this.onChange.bind(this),
  })
  return h('div', {
    style: { width: '100%', position: 'relative' },
  }, [
    h(ToAutoComplete, { ...opts }),
    this.ensIcon(),
  ])
}

EnsInput.prototype.componentDidMount = function () {
  const network = this.props.network
  const networkHasEnsSupport = getNetworkEnsSupport(network)
  this.setState({ ensResolution: ZERO_ADDRESS })

  if (networkHasEnsSupport) {
    const provider = global.ethereumProvider
    this.ens = new ENS({ provider, network })
    this.checkName = debounce(this.lookupEnsName.bind(this), 200)
  }
}

EnsInput.prototype.lookupEnsName = function (recipient) {
  const { ensResolution } = this.state

  log.info(`ENS attempting to resolve name: ${recipient}`)
  this.ens.lookup(recipient.trim())
  .then((address) => {
    if (address === ZERO_ADDRESS) throw new Error(this.context.t('noAddressForName'))
    if (address !== ensResolution) {
      this.setState({
        loadingEns: false,
        ensResolution: address,
        nickname: recipient.trim(),
        hoverText: address + '\n' + this.context.t('clickCopy'),
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
    if (isValidENSAddress(recipient) && reason.message === 'ENS name not defined.') {
      setStateObj.hoverText = this.context.t('ensNameNotFound')
      setStateObj.toError = 'ensNameNotFound'
      setStateObj.ensFailure = false
    } else {
      log.error(reason)
      setStateObj.hoverText = reason.message
    }

    return this.setState(setStateObj)
  })
}

EnsInput.prototype.componentDidUpdate = function (prevProps, prevState) {
  const state = this.state || {}
  const ensResolution = state.ensResolution
  // If an address is sent without a nickname, meaning not from ENS or from
  // the user's own accounts, a default of a one-space string is used.
  const nickname = state.nickname || ' '
  if (prevProps.network !== this.props.network) {
    const provider = global.ethereumProvider
    this.ens = new ENS({ provider, network: this.props.network })
    this.onChange(ensResolution)
  }
  if (prevState && ensResolution && this.props.onChange &&
      ensResolution !== prevState.ensResolution) {
    this.props.onChange({ toAddress: ensResolution, nickname, toError: state.toError })
  }
}

EnsInput.prototype.ensIcon = function (recipient) {
  const { hoverText } = this.state || {}
  return h('span.#ensIcon', {
    title: hoverText,
    style: {
      position: 'absolute',
      top: '16px',
      left: '-25px',
    },
  }, this.ensIconContents(recipient))
}

EnsInput.prototype.ensIconContents = function (recipient) {
  const { loadingEns, ensFailure, ensResolution, toError } = this.state || { ensResolution: ZERO_ADDRESS }

  if (toError) return

  if (loadingEns) {
    return h('img', {
      src: 'images/loading.svg',
      style: {
        width: '30px',
        height: '30px',
        transform: 'translateY(-6px)',
      },
    })
  }

  if (ensFailure) {
    return h('i.fa.fa-warning.fa-lg.warning')
  }

  if (ensResolution && (ensResolution !== ZERO_ADDRESS)) {
    return h('i.fa.fa-check-circle.fa-lg.cursor-pointer', {
      style: { color: 'green' },
      onClick: (event) => {
        event.preventDefault()
        event.stopPropagation()
        copyToClipboard(ensResolution)
      },
    })
  }
}

function getNetworkEnsSupport (network) {
  return Boolean(networkMap[network])
}
