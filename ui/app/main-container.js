const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const AccountAndTransactionDetails = require('./account-and-transaction-details')
const Settings = require('./components/pages/settings')
const log = require('loglevel')

import UnlockScreen from './components/pages/unlock-page'

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
  const contents = {
    component: AccountAndTransactionDetails,
    key: 'account-detail',
    style: {},
  }

  if (this.props.isUnlocked === false) {
    switch (this.props.currentViewName) {
      case 'config':
        log.debug('rendering config screen from unlock screen.')
        return h(Settings, {key: 'config'})
      default:
        log.debug('rendering locked screen')
        return h('.unlock-screen-container', {}, h(UnlockScreen, { key: 'locked' }))
    }
  }

  return h('div.main-container', {
    style: contents.style,
  }, [
    h(contents.component, {
      key: contents.key,
    }, []),
  ])
}

