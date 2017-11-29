const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const AccountAndTransactionDetails = require('./account-and-transaction-details')
const UnlockScreen = require('./components/pages/unauthenticated/unlock')

module.exports = MainContainer

inherits(MainContainer, Component)
function MainContainer () {
  Component.call(this)
}

MainContainer.prototype.render = function () {
  // 3. summarize:
  //  switch statement goes inside MainContainer,
  //  or a method in renderPrimary
  //    - pass resulting h() to MainContainer
  //  - error checking in separate func
  //  - router in separate func
  let contents = {
    component: AccountAndTransactionDetails,
    key: 'account-detail',
    style: {},
  }

  return h('div.main-container', {
    style: contents.style,
  }, [
    h(contents.component, {
      key: contents.key,
    }, []),
  ])
}

