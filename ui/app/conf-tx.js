const inherits = require('util').inherits
const Component = require('react').Component
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const copyToClipboard = require('copy-to-clipboard')
const actions = require('./actions')
const AccountPanel = require('./components/account-panel')
const valuesFor = require('./util').valuesFor
const addressSummary = require('./util').addressSummary
const readableDate = require('./util').readableDate
const formatBalance = require('./util').formatBalance
const dataSize = require('./util').dataSize

module.exports = connect(mapStateToProps)(ConfirmTxScreen)

function mapStateToProps(state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    selectedAddress: state.metamask.selectedAddress,
    unconfTxs: state.metamask.unconfTxs,
    index: state.appState.currentView.context,
  }
}

inherits(ConfirmTxScreen, Component)
function ConfirmTxScreen() {
  Component.call(this)
}


ConfirmTxScreen.prototype.render = function() {
  var state = this.props
  var unconfTxList = valuesFor(state.unconfTxs).sort(tx => tx.time)
  var txData = unconfTxList[state.index] || {}
  var txParams = txData.txParams || {}
  var address =  txParams.from || state.selectedAddress
  var identity = state.identities[address] || { address: address }
  var account = state.accounts[address] || { address: address }

  return (

    h('.unconftx-section.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.navigateToAccounts.bind(this),
        }),
        h('h2.page-subtitle', 'Confirm Transaction'),
      ]),

      h('h3', {
        style: {
          alignSelf: 'center',
          display: unconfTxList.length > 1 ? 'block' : 'none',
        },
      }, [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          style: {
            display: state.index === 0 ? 'none' : 'inline-block',
          },
          onClick: () => state.dispatch(actions.previousTx()),
        }),
        ` Transaction ${state.index + 1} of ${unconfTxList.length} `,
        h('i.fa.fa-arrow-right.fa-lg.cursor-pointer', {
          style: {
            display: state.index + 1 === unconfTxList.length ? 'none' : 'inline-block',
          },
          onClick: () => state.dispatch(actions.nextTx()),
        }),
      ]),

      h(ReactCSSTransitionGroup, {
        transitionName: "main",
        transitionEnterTimeout: 300,
        transitionLeaveTimeout: 300,
      }, [

        h('.transaction', {
          key: txData.id,
        }, [

          // account that will sign
          h(AccountPanel, {
            showFullAddress: true,
            identity: identity,
            account: account,
          }),

          // tx data
          h('.tx-data.flex-column.flex-justify-center.flex-grow.select-none', [

            h('.flex-row.flex-space-between', [
              h('label.font-small', 'TO ADDRESS'),
              h('span.font-small', addressSummary(txParams.to)),
            ]),

            h('.flex-row.flex-space-between', [
              h('label.font-small', 'DATE'),
              h('span.font-small', readableDate(txData.time)),
            ]),

            h('.flex-row.flex-space-between', [
              h('label.font-small', 'AMOUNT'),
              h('span.font-small', formatBalance(txParams.value)),
            ]),

          ]),

          // send + cancel
          h('.flex-row.flex-space-around', [
            h('button', {
              onClick: this.cancelTransaction.bind(this, txData),
            }, 'Cancel'),
            h('button', {
              onClick: this.sendTransaction.bind(this, txData),
            }, 'Send'),
          ]),
        ]),
      ]),
    ]) // No comma or semicolon can go here
  )
}

ConfirmTxScreen.prototype.sendTransaction = function(txData, event){
  event.stopPropagation()
  this.props.dispatch(actions.sendTx(txData))
}

ConfirmTxScreen.prototype.cancelTransaction = function(txData, event){
  event.stopPropagation()
  this.props.dispatch(actions.cancelTx(txData))
}

ConfirmTxScreen.prototype.navigateToAccounts = function(event){
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}
