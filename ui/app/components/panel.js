const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const Identicon = require('./identicon')

module.exports = Panel

inherits(Panel, Component)
function Panel () {
  Component.call(this)
}

Panel.prototype.render = function () {
  var state = this.props

  var style = {
    flex: '1 0 auto',
  }

  if (state.onClick) style.cursor = 'pointer'

  return (
    h('.identity-panel.flex-row.flex-space-between', {
      style,
      onClick: state.onClick,
    }, [

      // account identicon
      h('.identicon-wrapper.flex-column.select-none', [
        h(Identicon, {
          address: state.identiconKey,
        }),
        h('span.font-small', state.identiconLabel),
      ]),

      // account address, balance
      h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', [

        state.attributes.map((attr) => {
          return h('.flex-row.flex-space-between', {
            key: '' + Math.round(Math.random() * 1000000),
          }, [
            h('label.font-small.no-select', attr.key),
            h('span.font-small', attr.value),
          ])
        }),
      ]),

      // outlet for inserting additional stuff
      state.children,
    ])
  )
}

