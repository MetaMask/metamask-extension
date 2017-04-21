const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

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
    h('li', [
      h('span', `${symbol}: ${string}`),
    ])
  )
}
