const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')
const Tooltip = require('./components/tooltip.js')
const ethUtil = require('ethereumjs-util')
const Copyable = require('./components/copy/copyable')
const { addressSummary, toChecksumAddress, isValidAddress } = require('./util')


module.exports = connect(mapStateToProps)(AddSuggestedTokenScreen)

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    suggestedTokens: state.metamask.suggestedTokens,
  }
}

inherits(AddSuggestedTokenScreen, Component)
function AddSuggestedTokenScreen () {
    this.state = {
    warning: null,
  }
  Component.call(this)
}

AddSuggestedTokenScreen.prototype.render = function () {
  const { warning } = this.state
  const { network, suggestedTokens, dispatch } = this.props
  const key = Object.keys(suggestedTokens)[0]
  const { address, symbol, decimals } = suggestedTokens[key]

  return (
    h('.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('h2.page-subtitle', 'Add Suggested Token'),
      ]),

      h('.error', {
        style: {
          display: warning ? 'block' : 'none',
          padding: '0 20px',
          textAlign: 'center',
        },
      }, warning),

      // conf view
      h('.flex-column.flex-justify-center.flex-grow.select-none', [
        h('.flex-space-around', {
          style: {
            padding: '20px',
          },
        }, [

          h('div', [
            h(Tooltip, {
              title: 'The contract of the actual token contract. Click for more info.',
              position: 'top',
              id: 'addSuggestedToken',
            }, [
              h('a', {
                style: { fontWeight: 'bold', paddingRight: '10px'},
                href: 'https://support.metamask.io/kb/article/24-what-is-a-token-contract-address',
                target: '_blank',
                'data-tip': '',
                'data-for': 'addSuggestedToken',
              }, [
                h('span', 'Token Contract Address  '),
                h('i.fa.fa-question-circle'),
              ]),
            ]),
          ]),

          h('div', {
            style: { display: 'flex' },
          }, [
            h(Copyable, {
            value: toChecksumAddress(network, address),
            }, [
              h('span#token-address', {
                style: {
                  width: 'inherit',
                  flex: '1 0 auto',
                  height: '30px',
                  margin: '8px',
                  display: 'flex',
                },
              }, addressSummary(network, address, 24, 4, false)),
            ]),
          ]),

          h('div', [
            h('span', {
              style: { fontWeight: 'bold', paddingRight: '10px'},
            }, 'Token Symbol'),
          ]),

          h('div', { style: {display: 'flex'} }, [
            h('p#token_symbol', {
              style: {
                width: 'inherit',
                flex: '1 0 auto',
                height: '30px',
                margin: '8px',
              },
            }, symbol),
          ]),

          h('div', [
            h('span', {
              style: { fontWeight: 'bold', paddingRight: '10px'},
            }, 'Decimals of Precision'),
          ]),

          h('div', { style: {display: 'flex'} }, [
            h('p#token_decimals', {
              type: 'number',
              style: {
                width: 'inherit',
                flex: '1 0 auto',
                height: '30px',
                margin: '8px',
              },
            }, decimals),
          ]),

          h('button', {
            style: {
              alignSelf: 'center',
              margin: '8px',
            },
            onClick: (event) => {
              dispatch(actions.removeSuggestedTokens())
            },
          }, 'Cancel'),

          h('button', {
            style: {
              alignSelf: 'center',
              margin: '8px',
            },
            onClick: (event) => {
              const valid = this.validateInputs({ address, symbol, decimals })
              if (!valid) return

              dispatch(actions.addToken(address.trim(), symbol.trim(), decimals))
                .then(() => {
                  dispatch(actions.removeSuggestedTokens())
                })
            },
          }, 'Add'),
        ]),
      ]),
    ])
  )
}

AddSuggestedTokenScreen.prototype.componentWillMount = function () {
  if (typeof global.ethereumProvider === 'undefined') return
}

AddSuggestedTokenScreen.prototype.validateInputs = function (opts) {
  const { network, identities } = this.props
  let msg = ''
  const identitiesList = Object.keys(identities)
  const { address, symbol, decimals } = opts
  const standardAddress = ethUtil.addHexPrefix(address).toLowerCase()

  const validAddress = isValidAddress(address, network)
  if (!validAddress) {
    msg += 'Address is invalid.'
  }

  const validDecimals = decimals >= 0 && decimals <= 36
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
