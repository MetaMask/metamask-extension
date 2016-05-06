const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const Component = require('react').Component
const h = require('react-hyperscript')
const Identicon = require('identicon.js')

module.exports = Panel


inherits(Panel, Component)
function Panel() {
  Component.call(this)
}

Panel.prototype.render = function() {
  var state = this.props

  var identity = state.identity || {}
  var account = state.account || {}
  var isFauceting = state.isFauceting

  var identicon = new Identicon(state.identiconKey, 46).toString()
  var identiconSrc = `data:image/png;base64,${identicon}`

  return (
    h('.identity-panel.flex-row.flex-space-between', {
      style: {
        flex: '1 0 auto',
      },
      onClick: state.onClick,
    }, [

      // account identicon
      h('.identicon-wrapper.flex-column.select-none', [
        h('img.identicon', {
          src: identiconSrc,
          style: {
            border: 'none',
            borderRadius: '20px',
          }
        }),
        h('span.font-small', state.identiconLabel),
      ]),

      // account address, balance
      h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', [

        state.attributes.map((attr) => {
          return h('.flex-row.flex-space-between', {
            key: '' + Math.round(Math.random() * 1000000),
          }, [
            h('label.font-small', attr.key),
            h('span.font-small', attr.value),
          ])
        }),
      ]),

      // outlet for inserting additional stuff
      state.children,
    ])
  )
}

