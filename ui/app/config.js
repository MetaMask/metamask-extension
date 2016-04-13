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
            state.dispatch(actions.showAccountsPage())
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


          h('div', [
            h('input', {
              placeholder: 'New RPC URL',
              style: {
                width: '100%',
              },
              onKeyPress(event) {
                if (event.key === 'Enter') {
                  var element = event.target
                  var newRpc = element.value
                  state.dispatch(actions.setRpcTarget(newRpc))
                }
              }
            }),
          ]),

          h('div', [
            h('button', {
              style: {
                alignSelf: 'center',
              },
              onClick(event) {
                event.preventDefault()
                state.dispatch(actions.setRpcTarget('https://rpc.metamask.io/'))
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
                state.dispatch(actions.setRpcTarget('https://testrpc.metamask.io/'))
              }
            }, 'Use Morden Test Network')
          ]),

        ]),
      ]),
    ])
  )
}

function currentProviderDisplay(metamaskState) {
  var rpc = metamaskState.rpcTarget
  return h('div', [
    h('h3', {style: { fontWeight: 'bold' }}, 'Currently using RPC'),
    h('p', rpc)
  ])
}
