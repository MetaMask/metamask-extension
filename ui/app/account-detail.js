const inherits = require('util').inherits
const extend = require('xtend')
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const copyToClipboard = require('copy-to-clipboard')
const actions = require('./actions')
const addressSummary = require('./util').addressSummary
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const valuesFor = require('./util').valuesFor

const Identicon = require('./components/identicon')
const EtherBalance = require('./components/eth-balance')
const TransactionList = require('./components/transaction-list')
const ExportAccountView = require('./components/account-export')
const ethUtil = require('ethereumjs-util')
const EditableLabel = require('./components/editable-label')

module.exports = connect(mapStateToProps)(AccountDetailScreen)

function mapStateToProps(state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    address: state.metamask.selectedAccount,
    accountDetail: state.appState.accountDetail,
    transactions: state.metamask.transactions,
    network: state.metamask.network,
    unconfTxs: valuesFor(state.metamask.unconfTxs),
    unconfMsgs: valuesFor(state.metamask.unconfMsgs),
  }
}

inherits(AccountDetailScreen, Component)
function AccountDetailScreen() {
  Component.call(this)
}

AccountDetailScreen.prototype.render = function() {
  var props = this.props
  var selected = props.address || Object.keys(props.accounts)[0]
  var identity = props.identities[selected]
  var account = props.accounts[selected]
  var accountDetail = props.accountDetail
  var transactions = props.transactions

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
              width: '30px',
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
          h('img.cursor-pointer.color-orange', {
            src: 'images/switch_acc.svg',
            onClick: this.navigateToAccounts.bind(this),
          }),
        ]),

        h('.flex-center', {
          style: {
            height: '62px',
            paddingTop: '8px',
          }
        }, [
          h(EditableLabel, {
            textValue: identity ? identity.name : '',
            state: {
              isEditingLabel: false,
            },
            saveText: (text) => {
              props.dispatch(actions.saveAccountLabel(selected, text))
            },
          }, [

            // What is shown when not editing + edit text:
            h('label.editing-label',[h('.edit-text','edit')]),
            h('h2.font-medium.color-forest', {name: 'edit'}, identity && identity.name),
          ]),
        ]),

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

          h('img.cursor-pointer.color-orange', {
            src: 'images/copy.svg',
            onClick: () => copyToClipboard(ethUtil.toChecksumAddress(selected)),
            style:{
              marginLeft: '64px',
            },
          }),

          h('img.cursor-pointer.color-orange', {
            src: 'images/download.svg',
            onClick: () => this.requestAccountExport(selected),
            style:{
              position: 'relative',
              right: '32px',
            },
          }),

        ]),

        // balance + send
        h('.flex-row.flex-space-between', [

          h(EtherBalance, {
            value: account && account.balance,
            style: {
              lineHeight: '50px',
            },
          }),

          h('button', {
            onClick: () => props.dispatch(actions.showSendPage()),
            style: {
              margin: 10,
            },
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
  const { transactions, unconfTxs, unconfMsgs, address, network } = this.props

  var txsToRender = transactions
  // only transactions that are from the current address
  .filter(tx => tx.txParams.from === address)
  // only transactions that are on the current network
  .filter(tx => tx.txParams.metamaskNetworkId === network)
  // sort by recency
  .sort((a, b) => b.time - a.time)

  return h(TransactionList, {
    txsToRender,
    network,
    unconfTxs,
    unconfMsgs,
    viewPendingTx:(txId) => {
      this.props.dispatch(actions.viewPendingTx(txId))
    }
  })
}

AccountDetailScreen.prototype.navigateToAccounts = function(event){
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

AccountDetailScreen.prototype.requestAccountExport = function() {
  this.props.dispatch(actions.requestExportAccount())
}

