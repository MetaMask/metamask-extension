const inherits = require('util').inherits
const extend = require('xtend')
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const copyToClipboard = require('copy-to-clipboard')
const actions = require('./actions')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')

const AccountPanel = require('./components/account-panel')
const transactionList = require('./components/transaction-list')
const ExportAccountView = require('./components/account-export')

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
  var selected = state.address || Object.keys(state.accounts)[0]
  var identity = state.identities[selected]
  var account = state.accounts[selected]
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
        key: 'accountPanel'
      }),

      h('div', {
        style: {
          display: 'flex',
        }
      }, [

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

      h(ReactCSSTransitionGroup, {
        transitionName: "main",
        transitionEnterTimeout: 300,
        transitionLeaveTimeout: 300,
      }, [
        this.subview(),
      ]),
      // transaction table
      /*
      h('section.flex-column', [
        h('span', 'your transaction history will go here.'),
      ]),
      */
    ])
  )
}

AccountDetailScreen.prototype.subview = function() {
  var subview
  try {
    subview = this.props.accountDetail.subview
  } catch (e) {
    subview = null
  }

  switch (subview) {
    case 'transactions':
      return this.transactionList()
    case 'export':
      var state = extend({key: 'export'}, this.props)
      return h(ExportAccountView, state)
    default:
      return this.transactionList()
  }
}

AccountDetailScreen.prototype.transactionList = function() {
  var state = this.props
  var transactions = state.transactions

  return transactionList(transactions
  .filter(tx => tx.txParams.from === state.address)
  .filter(tx => tx.txParams.metamaskNetworkId === state.networkVersion)
  .sort((a, b) => b.time - a.time), state.networkVersion)
}

AccountDetailScreen.prototype.navigateToAccounts = function(event){
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

AccountDetailScreen.prototype.requestAccountExport = function() {
  this.props.dispatch(actions.requestExportAccount())
}

