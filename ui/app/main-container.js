const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const AccountAndTransactionDetails = require('./account-and-transaction-details')
const HDRestoreVaultScreen = require('./keychains/hd/restore-vault')
const Settings = require('./settings')
const UnlockScreen = require('./unlock')

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

  if (this.props.isUnlocked === false) {
    switch (this.props.currentViewName) {
      case 'restoreVault':
        log.debug('rendering restore vault screen')
        contents = {
          component: HDRestoreVaultScreen,
          key: 'HDRestoreVaultScreen',
        }
        break
      case 'config':
        log.debug('rendering config screen from unlock screen.')
        return h(Settings, {key: 'config'})
      default:
        log.debug('rendering locked screen')
        contents = {
          component: UnlockScreen,
          style: {
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F7F7F7',
            // must force 100%, because lock screen is full-width
            width: '100%',
          },
          key: 'locked',
        }
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

