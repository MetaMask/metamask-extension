const inherits = require('util').inherits
const extend = require('xtend')
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const copyToClipboard = require('copy-to-clipboard')
const actions = require('./actions')
const addressSummary = require('./util').addressSummary
const formatBalance = require('./util').formatBalance
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')

const AccountPanel = require('./components/account-panel')
const Identicon = require('./components/identicon')
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

    h('.account-detail-section.flex-column.flex-grow', [

      // identicon, label, balance, etc
      h('.account-data-subsection.flex-column.flex-grow', {
        style: {
          margin: '0 20px',
        },
      }, [

        // header - identicon + nav
        h('.flex-row.flex-space-between', {
          style: {
            marginTop: 28,
          },
        }, [

          // invisible placeholder for later
          h('i.fa.fa-users.fa-lg.color-orange', {
            style: {
              visibility: 'hidden',
            },
          }),

          // large identicon
          h('.identicon-wrapper.flex-column.flex-center.select-none', [
            h(Identicon, {
              diameter: 62,
              address: selected,
            }),
          ]),

          // small accounts nav
          h('i.fa.fa-users.fa-lg.cursor-pointer.color-orange', {
            onClick: this.navigateToAccounts.bind(this),
          }),

        ]),

        // account label
        h('h2.font-medium.color-forest.flex-center', {
          style: {
            paddingTop: 8,
            marginBottom: 32,
          },
        }, identity && identity.name),

        // address and getter actions
        h('.flex-row.flex-space-between', {
          style: {
            marginBottom: 16,
          },
        }, [

          h('div', {
            style: {
              lineHeight: '16px',
            },
          }, addressSummary(selected)),

          h('i.fa.fa-download.fa-md.cursor-pointer.color-orange', {
            onClick: () => this.requestAccountExport(account.address),
          }),

          h('i.fa.fa-qrcode.fa-md.cursor-disabled.color-orange', {
            onClick: () => console.warn('QRCode not implented...'),
          }),

          h('i.fa.fa-clipboard.fa-md.cursor-pointer.color-orange', {
            onClick: () => copyToClipboard(account.address),
          }),

        ]),

        // balance + send
        h('.flex-row.flex-space-between', [

          h('div', {
            style: {
              lineHeight: '50px',
            },
          }, formatBalance(account && account.balance)),

          h('button', {
            onClick: () => this.props.dispatch(actions.showSendPage()),
          }, 'SEND ETH'),

        ]),
      
      ]),

      // subview (tx history, pk export confirm)
      h(ReactCSSTransitionGroup, {
        className: 'css-transition-group',
        transitionName: 'main',
        transitionEnterTimeout: 300,
        transitionLeaveTimeout: 300,
      }, [
        this.subview(),
      ]),

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

  var txsToRender = transactions
    // only transactions that are from the current address
    .filter(tx => tx.txParams.from === state.address)
    // only transactions that are on the current network
    .filter(tx => tx.txParams.metamaskNetworkId === state.networkVersion)
    // only transactions that have a hash
    .filter(tx => tx.hash)
    // sort by recency
    .sort((a, b) => b.time - a.time)

  return transactionList(txsToRender, state.networkVersion)
}

AccountDetailScreen.prototype.navigateToAccounts = function(event){
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

AccountDetailScreen.prototype.requestAccountExport = function() {
  this.props.dispatch(actions.requestExportAccount())
}

