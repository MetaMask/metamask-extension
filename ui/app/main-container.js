const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TxView = require('./components/tx-view')
const WalletView = require('./components/wallet-view')
const SlideoutMenu = require('react-burger-menu').slide

module.exports = MainContainer

inherits(MainContainer, Component)
function MainContainer () {
  Component.call(this)
}

MainContainer.prototype.render = function () {

  return h('div', {
    style: {
      position: 'absolute',
      marginTop: '6vh',
      width: '98%',
      zIndex: 20,
      boxShadow: '0 0 7px 0 rgba(0,0,0,0.08)',
      fontFamily: 'DIN OT',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      overflowY: 'scroll',
    }
  }, [

    h(WalletView, {
      style: {
      },
      responsiveDisplayClassname: '.lap-visible',
    }, [
    ]),

    h(TxView, {
      style: {
        // flexGrow: 2
        // width: '66.66%',
        // height: '82vh',
        // background: '#FFFFFF',
      }
    }, [
    ]),
  ])
}

