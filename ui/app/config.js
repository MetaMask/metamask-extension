const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')

module.exports = connect(mapStateToProps)(ConfigScreen)

function mapStateToProps(state) {
  return {
    rpc: state.metamask.rpcTarget,
    metamask: state.metamask,
  }
}

inherits(ConfigScreen, Component)
function ConfigScreen() {
  Component.call(this)
}


ConfigScreen.prototype.render = function() {
  var state = this.props
  var rpc = state.rpc
  var metamaskState = state.metamask

  return (
    h('.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            state.dispatch(actions.goHome())
          }
        }),
        h('h2.page-subtitle', 'Configuration'),
      ]),

      // conf view
      h('.flex-column.flex-justify-center.flex-grow.select-none', [
        h('.flex-space-around', {
          style: {
            padding: '20px',
          }
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
              onKeyPress(event) {
                if (event.key === 'Enter') {
                  var element = event.target
                  var newRpc = element.value
                  state.dispatch(actions.setRpcTarget(newRpc))
                }
              }
            }),
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick(event) {
                event.preventDefault()
                var element = document.querySelector('input#new_rpc')
                var newRpc = element.value
                state.dispatch(actions.setRpcTarget(newRpc))
              }
            }, 'Save')
          ]),

          h('div', [
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick(event) {
                event.preventDefault()
                state.dispatch(actions.setProviderType('mainnet'))
              }
            }, 'Use Main Network')
          ]),

          h('div', [
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick(event) {
                event.preventDefault()
                state.dispatch(actions.setProviderType('testnet'))
              }
            }, 'Use Morden Test Network')
          ]),

          h('div', [
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick(event) {
                event.preventDefault()
                state.dispatch(actions.setRpcTarget('http://localhost:8545/'))
              }
            }, 'Use http://localhost:8545')
          ]),

        ]),
      ]),
    ])
  )
}

function currentProviderDisplay(metamaskState) {
  var provider = metamaskState.provider
  var title, value

  switch (provider.type) {

    case 'mainnet':
      title = 'Current Network'
      value = 'Main Ethereum Network'
      break

    case 'testnet':
      title = 'Current Network'
      value = 'Morden Test Network'
      break

    default:
      title = 'Current RPC'
      value = metamaskState.provider.rpcTarget
 }

  return h('div', [
    h('span', {style: { fontWeight: 'bold', paddingRight: '10px'}}, title),
    h('span', value)
  ])
}
