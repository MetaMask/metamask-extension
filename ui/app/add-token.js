const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')

module.exports = connect(mapStateToProps)(AddTokenScreen)

function mapStateToProps (state) {
  return {}
}

inherits(AddTokenScreen, Component)
function AddTokenScreen () {
  this.state = { warning: null }
  Component.call(this)
}

AddTokenScreen.prototype.render = function () {
  const state = this.state
  const { warning } = state
  return (
    h('.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            state.dispatch(actions.goHome())
          },
        }),
        h('h2.page-subtitle', 'Add Token'),
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
            h('span', {
              style: { fontWeight: 'bold', paddingRight: '10px'},
            }, 'Token Sybmol'),
          ]),

          h('div', { style: {display: 'flex'} }, [
            h('input#token_symbol', {
              placeholder: `Like "ETH"`,
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
                }
              },
            }),
          ]),

          h('button', {
            style: {
              alignSelf: 'center',
            },
            onClick (event) {
              event.preventDefault()
              var tokenSymbolEl = document.querySelector('input#token_symbol')
              var tokenSymbol = tokenSymbolEl.value
              console.log(tokenSymbol)
            },
          }, 'Add'),
        ]),
      ]),
    ])
  )
}

