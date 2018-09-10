const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')
const Tooltip = require('./components/tooltip.js')


const ethUtil = require('ethereumjs-util')
const abi = require('human-standard-token-abi')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')

const emptyAddr = '0x0000000000000000000000000000000000000000'

module.exports = connect(mapStateToProps)(AddTokenScreen)

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    network: state.metamask.network,
  }
}

inherits(AddTokenScreen, Component)
function AddTokenScreen () {
  this.state = {
    warning: null,
    address: '',
    symbol: 'TOKEN',
    decimals: 18,
  }
  Component.call(this)
}

AddTokenScreen.prototype.render = function () {
  const state = this.state
  const props = this.props
  const { warning, symbol, decimals } = state
  const { network } = props

  return (
    h('.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            props.dispatch(actions.goHome())
          },
          style: {
            position: 'absolute',
            left: '30px',
          },
        }),
        h('h2.page-subtitle', 'Add Token'),
      ]),

      h('div', {
        style: {
          margin: '0 30px',
        },
      }, [
        h('.error', {
          style: {
            display: warning ? 'block' : 'none',
          },
        }, warning),
      ]),

      // conf view
      h('.flex-column.flex-justify-center.flex-grow.select-none', [
        h('.flex-space-around', {
          style: {
            padding: '30px',
          },
        }, [

          h('div', [
            h(Tooltip, {
              position: 'top',
              title: 'The contract of the actual token contract.',
            }, [
              h('span', 'Token Contract Address  '),
            ]),
          ]),

          h('section.flex-row.flex-center', [
            h('input.large-input#token-address', {
              name: 'address',
              placeholder: 'Token Contract Address',
              onChange: this.tokenAddressDidChange.bind(this),
              style: {
                width: '100%',
                margin: '10px 0',
              },
            }),
          ]),

          h('div', [
            h('span', {
              style: { fontWeight: 'bold', paddingRight: '10px'},
            }, 'Token Symbol'),
          ]),

          h('div', { style: {display: 'flex'} }, [
            h('input.large-input#token_symbol', {
              placeholder: `Like "ETH"`,
              value: symbol,
              style: {
                width: '100%',
                margin: '10px 0',
              },
              onChange: (event) => {
                var element = event.target
                var symbol = element.value
                this.setState({ symbol })
              },
            }),
          ]),

          h('div', [
            h('span', {
              style: { fontWeight: 'bold', paddingRight: '10px'},
            }, 'Decimals of Precision'),
          ]),

          h('div', { style: {display: 'flex'} }, [
            h('input.large-input#token_decimals', {
              value: decimals,
              type: 'number',
              min: 0,
              max: 36,
              style: {
                width: '100%',
                margin: '10px 0',
              },
              onChange: (event) => {
                var element = event.target
                var decimals = element.value.trim()
                this.setState({ decimals })
              },
            }),
          ]),

          h('button', {
            style: {
              alignSelf: 'center',
              float: 'right',
              marginTop: '10px',
            },
            onClick: (event) => {
              const valid = this.validateInputs()
              if (!valid) return

              const { address, symbol, decimals } = this.state
              this.props.dispatch(actions.addToken(address.trim(), symbol.trim(), decimals, network))
                .then(() => {
                  this.props.dispatch(actions.goHome())
                })
            },
          }, 'Add'),
        ]),
      ]),
    ])
  )
}

AddTokenScreen.prototype.componentWillMount = function () {
  if (typeof global.ethereumProvider === 'undefined') return

  this.eth = new Eth(global.ethereumProvider)
  this.contract = new EthContract(this.eth)
  this.TokenContract = this.contract(abi)
}

AddTokenScreen.prototype.tokenAddressDidChange = function (event) {
  const el = event.target
  const address = el.value.trim()
  if (ethUtil.isValidAddress(address) && address !== emptyAddr) {
    this.setState({ address })
    this.attemptToAutoFillTokenParams(address)
  }
}

AddTokenScreen.prototype.validateInputs = function () {
  let msg = ''
  const state = this.state
  const identitiesList = Object.keys(this.props.identities)
  const { address, symbol, decimals } = state
  const standardAddress = ethUtil.addHexPrefix(address).toLowerCase()

  const validAddress = ethUtil.isValidAddress(address)
  if (!validAddress) {
    msg += 'Address is invalid.'
  }

  const validDecimals = decimals >= 0 && decimals < 36
  if (!validDecimals) {
    msg += 'Decimals must be at least 0, and not over 36. '
  }

  const symbolLen = symbol.trim().length
  const validSymbol = symbolLen > 0 && symbolLen < 10
  if (!validSymbol) {
    msg += 'Symbol must be between 0 and 10 characters.'
  }

  const ownAddress = identitiesList.includes(standardAddress)
  if (ownAddress) {
    msg = 'Personal address detected. Input the token contract address.'
  }

  const isValid = validAddress && validDecimals && !ownAddress

  if (!isValid) {
    this.setState({
      warning: msg,
    })
  } else {
    this.setState({ warning: null })
  }

  return isValid
}

AddTokenScreen.prototype.attemptToAutoFillTokenParams = async function (address) {
  const contract = this.TokenContract.at(address)

  const results = await Promise.all([
    contract.symbol(),
    contract.decimals(),
  ])

  const [ symbol, decimals ] = results
  if (symbol && decimals) {
    console.log('SETTING SYMBOL AND DECIMALS', { symbol, decimals })
    this.setState({ symbol: symbol[0], decimals: decimals[0].toString() })
  }
}
