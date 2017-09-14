const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')
const infuraCurrencies = require('./infura-conversion.json').symbols
const validUrl = require('valid-url')
const exportAsFile = require('./util').exportAsFile


module.exports = connect(mapStateToProps)(ConfigScreen)

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    warning: state.appState.warning,
  }
}

inherits(ConfigScreen, Component)
function ConfigScreen () {
  Component.call(this)
}

ConfigScreen.prototype.render = function () {
  var state = this.props
  var metamaskState = state.metamask
  var warning = state.warning

  return (
    h('.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            state.dispatch(actions.goHome())
          },
        }),
        h('h2.page-subtitle', 'Settings'),
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

          currentProviderDisplay(metamaskState),

          h('div', { style: {display: 'flex'} }, [
            h('input#new_rpc', {
              placeholder: 'New RPC URL',
              style: {
                width: 'inherit',
                flex: '1 0 auto',
                height: '30px',
                margin: '8px',
              },
              onKeyPress (event) {
                if (event.key === 'Enter') {
                  var element = event.target
                  var newRpc = element.value
                  rpcValidation(newRpc, state)
                }
              },
            }),
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick (event) {
                event.preventDefault()
                var element = document.querySelector('input#new_rpc')
                var newRpc = element.value
                rpcValidation(newRpc, state)
              },
            }, 'Save'),
          ]),

          h('hr.horizontal-line'),

          currentConversionInformation(metamaskState, state),

          h('hr.horizontal-line'),

          h('div', {
            style: {
              marginTop: '20px',
            },
          }, [
            h('p', {
              style: {
                fontFamily: 'Montserrat Light',
                fontSize: '13px',
              },
            }, `State logs contain your public account addresses and sent transactions.`),
            h('br'),
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick (event) {
                exportAsFile('MetaMask State Logs', window.logState())
              },
            }, 'Download State Logs'),
          ]),

          h('hr.horizontal-line'),

          h('div', {
            style: {
              marginTop: '20px',
            },
          }, [
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick (event) {
                event.preventDefault()
                state.dispatch(actions.revealSeedConfirmation())
              },
            }, 'Reveal Seed Words'),
          ]),

        ]),
      ]),
    ])
  )
}

function rpcValidation (newRpc, state) {
  if (validUrl.isWebUri(newRpc)) {
    state.dispatch(actions.setRpcTarget(newRpc))
  } else {
    var appendedRpc = `http://${newRpc}`
    if (validUrl.isWebUri(appendedRpc)) {
      state.dispatch(actions.displayWarning('URIs require the appropriate HTTP/HTTPS prefix.'))
    } else {
      state.dispatch(actions.displayWarning('Invalid RPC URI'))
    }
  }
}

function currentConversionInformation (metamaskState, state) {
  var currentCurrency = metamaskState.currentCurrency
  var conversionDate = metamaskState.conversionDate
  return h('div', [
    h('span', {style: { fontWeight: 'bold', paddingRight: '10px'}}, 'Current Conversion'),
    h('span', {style: { fontWeight: 'bold', paddingRight: '10px', fontSize: '13px'}}, `Updated ${Date(conversionDate)}`),
    h('select#currentCurrency', {
      onChange (event) {
        event.preventDefault()
        var element = document.getElementById('currentCurrency')
        var newCurrency = element.value
        state.dispatch(actions.setCurrentCurrency(newCurrency))
      },
      defaultValue: currentCurrency,
    }, infuraCurrencies.map((currency) => {
      return h('option', {key: currency, value: currency}, currency)
    })
  ),
  ])
}

function currentProviderDisplay (metamaskState) {
  var provider = metamaskState.provider
  var title, value

  switch (provider.type) {

    case 'mainnet':
      title = 'Current Network'
      value = 'Main Ethereum Network'
      break

    case 'ropsten':
      title = 'Current Network'
      value = 'Ropsten Test Network'
      break

    case 'kovan':
      title = 'Current Network'
      value = 'Kovan Test Network'
      break

    case 'rinkeby':
      title = 'Current Network'
      value = 'Rinkeby Test Network'
      break

    default:
      title = 'Current RPC'
      value = metamaskState.provider.rpcTarget
  }

  return h('div', [
    h('span', {style: { fontWeight: 'bold', paddingRight: '10px'}}, title),
    h('span', value),
  ])
}
