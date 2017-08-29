const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = WalletContentDisplay

inherits(WalletContentDisplay, Component)
function WalletContentDisplay () {
  Component.call(this)
}

WalletContentDisplay.prototype.render = function () {
  const { title, amount, fiatValue, active, style } = this.props

  // TODO: Separate component: wallet-content-account
  return h('div.flex-column', {
    style: {
      marginLeft: '1.3em',
      alignItems: 'flex-start',
      ...style,
    },
  }, [

    h('span', {
      style: {
        fontSize: '1.1em',
      },
    }, title),

    h('span', {
      style: {
        fontSize: '1.8em',
        margin: '0.4em 0em',
      },
    }, amount),

    h('span', {
      style: {
        fontSize: '1.3em',
      },
    }, fiatValue),

    active && h('div', {
      style: {
        position: 'absolute',
        marginLeft: '-1.3em',
        height: '6em',
        width: '0.3em',
        background: '#D8D8D8', // $alto
      },
    }, [
    ]),
  ])

}

