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

  return h('div.main-container', {
    style: {}
  }, [h(AccountAndTransactionDetails, {}, [])])
}

