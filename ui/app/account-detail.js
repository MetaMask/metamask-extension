const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const copyToClipboard = require('copy-to-clipboard')
const actions = require('./actions')
const AccountPanel = require('./components/account-panel')

module.exports = connect(mapStateToProps)(AccountDetailScreen)

function mapStateToProps(state) {
  var accountDetail = state.appState.accountDetail
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    address: state.appState.currentView.context,
    accountDetail: accountDetail,
  }
}

inherits(AccountDetailScreen, Component)
function AccountDetailScreen() {
  Component.call(this)
}


AccountDetailScreen.prototype.render = function() {
  var state = this.props
  var identity = state.identities[state.address]
  var account = state.accounts[state.address]
  var accountDetail = state.accountDetail

  return (

    h('.account-detail-section.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.navigateToAccounts.bind(this),
        }),
        h('h2.page-subtitle', 'Account Detail'),
      ]),

      // account summary, with embedded action buttons
      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
      }, [
        h('.flex-row.flex-space-around', [
          // h('button', 'GET ETH'), DISABLED UNTIL WORKING

          h('button', {
            onClick: () => {
              copyToClipboard(identity.address)
            },
          }, 'COPY ADDR'),

          h('button', {
            onClick: () => {
              this.props.dispatch(actions.showSendPage())
            },
          }, 'SEND'),

          h('button', {
            onClick: () => {
              this.requestAccountExport(identity.address)
            },
          }, 'EXPORT'),
        ]),
      ]),

      this.exportedAccount(accountDetail),

      // transaction table
      /*
      h('section.flex-column', [
        h('span', 'your transaction history will go here.'),
      ]),
      */
    ])
  )
}

AccountDetailScreen.prototype.navigateToAccounts = function(event){
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

AccountDetailScreen.prototype.exportAccount = function(address) {
  this.props.dispatch(actions.exportAccount(address))
}

AccountDetailScreen.prototype.requestAccountExport = function() {
  this.props.dispatch(actions.requestExportAccount())
}

AccountDetailScreen.prototype.exportedAccount = function(accountDetail) {
  if (!accountDetail) return
  var accountExport = accountDetail.accountExport

  var notExporting = accountExport === 'none'
  var exportRequested = accountExport === 'requested'
  var accountExported = accountExport === 'completed'

  if (notExporting) return

  if (exportRequested) {
    var warning = `Exporting your private key is very dangerous,
      and you should only do it if you know what you're doing.`
    var confirmation = `If you're absolutely sure, type "I understand" below and
                        hit Enter.`
    return h('div', {}, [
      h('p.error', warning),
      h('p', confirmation),
      h('input#exportAccount', {
        onKeyPress: this.onExportKeyPress.bind(this),
      })
    ])
  }

  if (accountExported) {
    return h('div.privateKey', {

    }, [
      h('label', 'Your private key (click to copy):'),
      h('p.error.cursor-pointer', {
        style: {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          webkitUserSelect: 'text',
          width: '100%',
        },
        onClick: function(event) {
          copyToClipboard(accountDetail.privateKey)
        }
      }, accountDetail.privateKey),
    ])
  }
}

AccountDetailScreen.prototype.onExportKeyPress = function(event) {
  if (event.key !== 'Enter') return
  event.preventDefault()

  var input = document.getElementById('exportAccount')
  if (input.value === 'I understand') {
    this.props.dispatch(actions.exportAccount(this.props.address))
  } else {
    input.value = ''
    input.placeholder = 'Please retype "I understand" exactly.'
  }
}
