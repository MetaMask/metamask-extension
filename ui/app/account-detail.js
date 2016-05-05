const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const copyToClipboard = require('copy-to-clipboard')
const actions = require('./actions')
const AccountPanel = require('./components/account-panel')
const transactionList = require('./components/transaction-list')

module.exports = connect(mapStateToProps)(AccountDetailScreen)

function mapStateToProps(state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    address: state.metamask.selectedAccount,
    accountDetail: state.appState.accountDetail,
    transactions: state.metamask.transactions,
    networkVersion: state.metamask.network,
  }
}

inherits(AccountDetailScreen, Component)
function AccountDetailScreen() {
  Component.call(this)
}

AccountDetailScreen.prototype.render = function() {
  var state = this.props
  var selected = state.address || Object.keys(state.accounts[0]).address
  var identity = state.identities[state.address]
  var account = state.accounts[state.address]
  var accountDetail = state.accountDetail
  var transactions = state.transactions

  return (

    h('.account-detail-section.flex-column.flex-grow', {
      style: {
        width: '330px',
      },
    }, [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('h2.page-subtitle', 'Account Detail'),
      ]),

      // account summary, with embedded action buttons
      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
      }, []),

      h('div', {
        style: {
          display: 'flex',
        }
      }, [

        h('button', {
          onClick: this.navigateToAccounts.bind(this),
        }, 'CHANGE ACCT'),

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

      transactionList(transactions
        .filter(tx => tx.txParams.from === state.address)
        .filter(tx => tx.txParams.metamaskNetworkId === state.networkVersion)
        .sort((a, b) => b.time - a.time), state.networkVersion),
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
