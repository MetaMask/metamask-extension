const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TxView = require('./components/tx-view')
const WalletView = require('./components/wallet-view')
const SlideoutMenu = require('react-burger-menu').slide
const AccountAndTransactionDetails = require('./account-and-transaction-details')

module.exports = MainContainer

inherits(MainContainer, Component)
function MainContainer () {
  Component.call(this)
}

MainContainer.prototype.render = function () {

  // 1. Fixing Mobile View: flush container
  //   media query for mobile view:
  //   position: absolute;
  //   margin-top: 35px;
  //   width: 100%;
  // 
  // 2. Fix responsive sizing - smaller
  //    https://puu.sh/x0gDA/5ff3b734eb.png
  // 
  // 3. summarize:
  //  switch statement goes inside MainContainer,
  //  or a method in renderPrimary
  //    - pass resulting h() to MainContainer
  //  - error checking in separate func
  //  - router in separate func
  //
  //  4. style all buttons as <button>s: accessibility + mobile focus

  return h('div', {
    style: {
      position: 'absolute',
      marginTop: '35px',
      width: '98%',
      zIndex: 20,
      boxShadow: '0 0 7px 0 rgba(0,0,0,0.08)',
      fontFamily: 'DIN OT',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      overflowY: 'scroll',
    }
  }, [h(AccountAndTransactionDetails, {}, [])])
}

