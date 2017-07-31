const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const WalletView = require('./components/wallet-view')

module.exports = MainContainer

inherits(MainContainer, Component)
function MainContainer () {
  Component.call(this)
}

MainContainer.prototype.render = function () {
  console.log("rendering MainContainer...");
  return h('div.flex-row', {
    style: {
      position: 'absolute',
      marginTop: '6vh',
      width: '98%',
      zIndex: 20,
      boxShadow: '0 0 7px 0 rgba(0,0,0,0.08)',
    }
  }, [
    h(WalletView, {
      style: {
        // width: '33.33%',
        // height: '82vh',
      }
    }, [
    ]),

    h('div.tx-view', {
      style: {
        width: '66.66%',
        height: '82vh',
        background: '#FFFFFF',
      }
    }, [
    ]),
  ])
}

