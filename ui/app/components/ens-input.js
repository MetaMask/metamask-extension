const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const extend = require('xtend')
const debounce = require('debounce')
const copyToClipboard = require('copy-to-clipboard')
const ENS = require('ethjs-ens')
const ensRE = /.+\.eth$/

const networkResolvers = {
  '3': '112234455c3a32fd11230c42e7bccd4a84e02010',
}

module.exports = EnsInput

inherits(EnsInput, Component)
function EnsInput () {
  Component.call(this)
}

EnsInput.prototype.render = function () {
  const props = this.props
  const opts = extend(props, {
    list: 'addresses',
    onChange: () => {
      const network = this.props.network
      let resolverAddress = networkResolvers[network]
      if (!resolverAddress) return

      const recipient = document.querySelector('input[name="address"]').value
      if (recipient.match(ensRE) === null) {
        return this.setState({
          loadingEns: false,
          ensResolution: null,
          ensFailure: null,
        })
      }

      this.setState({
        loadingEns: true,
      })
      this.checkName()
    },
  })

  return h('div', {
    style: { width: '100%' },
  }, [
    h('input.large-input', opts),
    h('datalist',
      {
        id: 'addresses',
      },
      [
        Object.keys(props.identities).map((key) => {
          return h('option', props.identities[key].address)
        }),
      ]),
    this.ensIcon(),
  ])
}

EnsInput.prototype.componentDidMount = function () {
  const network = this.props.network
  let resolverAddress = networkResolvers[network]

  if (resolverAddress) {
    const provider = web3.currentProvider
    this.ens = new ENS({ provider, network })
    this.checkName = debounce(this.lookupEnsName.bind(this), 200)
  }
}

EnsInput.prototype.lookupEnsName = function () {
  const recipient = document.querySelector('input[name="address"]').value
  const { ensResolution } = this.state

  if (!this.ens) {
    return this.setState({
      loadingEns: false,
      ensFailure: true,
      hoverText: 'ENS is not supported on your current network.',
    })
  }

  log.info(`ENS attempting to resolve name: ${recipient}`)
  this.ens.lookup(recipient.trim())
  .then((address) => {
    if (address !== ensResolution) {
      this.setState({
        loadingEns: false,
        ensResolution: address,
        hoverText: address + '\nClick to Copy',
      })
    }
  })
  .catch((reason) => {
    return this.setState({
      loadingEns: false,
      ensFailure: true,
      hoverText: reason.message,
    })
  })
}

EnsInput.prototype.componentDidUpdate = function (prevProps, prevState) {
  const state = this.state || {}
  const { ensResolution } = state
  if (ensResolution && this.props.onChange &&
      ensResolution !== prevState.ensResolution) {
    this.props.onChange(ensResolution)
  }
}

EnsInput.prototype.ensIcon = function (recipient) {
  const { hoverText } = this.state || {}
  return h('span', {
    title: hoverText,
    style: {
      position: 'absolute',
      padding: '9px',
      transform: 'translatex(-40px)',
    },
  }, this.ensIconContents(recipient))
}

EnsInput.prototype.ensIconContents = function (recipient) {
  const { loadingEns, ensFailure, ensResolution } = this.state || {}

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

  if (ensResolution) {
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
