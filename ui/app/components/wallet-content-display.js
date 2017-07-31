const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = WalletContentDisplay

inherits(WalletContentDisplay, Component)
function WalletContentDisplay () {
  Component.call(this)
}

WalletContentDisplay.prototype.render = function () {
  const { title, amount, fiatValue, active } = this.props

  return h('div.flex-column', {
    style: {
      marginLeft: '35px',
      marginTop: '15px',
      alignItems: 'flex-start',
    }
  }, [

    h('span', {
      style: {
        fontSize: '1.1em',
      },
    }, title),

    h('span', {
      style: {
        fontSize: '1.8em',
        margin: '10px 0px',
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
        marginLeft: '-35px',
        height: '6em',
        width: '4px',
        background: '#D8D8D8', // TODO: add to resuable colors
      }
    }, [
    ])
  ])
}

