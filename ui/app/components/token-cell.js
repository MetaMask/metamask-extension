const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')

module.exports = TokenCell

inherits(TokenCell, Component)
function TokenCell () {
  Component.call(this)
}

TokenCell.prototype.render = function () {
  const props = this.props
  const { address, symbol, string } = props
  log.info({ address, symbol, string })

  return (
    h('li.token-cell', [

      h(Identicon, {
        diameter: 50,
        address,
      }),

      h('h3', `${string || 0} ${symbol}`),
    ])
  )
}
