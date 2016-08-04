const inherits = require('util').inherits
const extend = require('xtend')
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const CopyButton = require('./components/copyButton')
const actions = require('./actions')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const valuesFor = require('./util').valuesFor

const Identicon = require('./components/identicon')
const EtherBalance = require('./components/eth-balance')
const TransactionList = require('./components/transaction-list')
const ExportAccountView = require('./components/account-export')
const ethUtil = require('ethereumjs-util')
const EditableLabel = require('./components/editable-label')
const Tooltip = require('./components/tooltip')
const BuyButtonSubview = require('./components/buy-button-subview')
module.exports = connect(mapStateToProps)(AccountDetailScreen)

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    address: state.metamask.selectedAccount,
    accountDetail: state.appState.accountDetail,
    transactions: state.metamask.transactions,
    network: state.metamask.network,
    unconfTxs: valuesFor(state.metamask.unconfTxs),
    unconfMsgs: valuesFor(state.metamask.unconfMsgs),
    isEthWarningConfirmed: state.metamask.isEthConfirmed,
  }
}

inherits(AccountDetailScreen, Component)
function AccountDetailScreen () {
  Component.call(this)
}

AccountDetailScreen.prototype.render = function () {
  var props = this.props
  var selected = props.address || Object.keys(props.accounts)[0]
  var identity = props.identities[selected]
  var account = props.accounts[selected]

  return (

    h('.account-detail-section', [

      // identicon, label, balance, etc
      h('.account-data-subsection', {
        style: {
          margin: '0 20px',
        },
      }, [

        // header - identicon + nav
        h('div', {
          style: {
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          },
        }, [

          // large identicon and addresses
          h('.identicon-wrapper.select-none', [
            h(Identicon, {
              diameter: 62,
              address: selected,
            }),
          ]),
          h('flex-column', {
            style: {
              lineHeight: '10px',
              marginLeft: '15px',
            },
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
              h('label.editing-label', [h('.edit-text', 'edit')]),
              h('h2.font-medium.color-forest', {name: 'edit'}, identity && identity.name),
            ]),
            h('.flex-row', {
              style: {
                width: '15em',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              },
            }, [

              // address

              h('div', {
                style: {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingTop: '3px',
                  width: '5em',
                  fontSize: '13px',
                  fontFamily: 'Montserrat Light',
                  textRendering: 'geometricPrecision',
                  marginTop: '10px',
                  marginBottom: '15px',
                  color: '#AEAEAE',
                },
              }, ethUtil.toChecksumAddress(selected)),

              // copy and export

              h('.flex-row', {
                style: {
                  justifyContent: 'flex-end',
                  position: 'relative',
                  bottom: '15px',
                },
              }, [
                h(CopyButton, {
                  value: ethUtil.toChecksumAddress(selected),
                }),

                h(Tooltip, {
                  title: 'Export Private Key',
                }, [
                  h('div', {
                    style: {
                      margin: '5px',
                    },
                  }, [
                    h('img.cursor-pointer.color-orange', {
                      src: 'images/key-32.png',
                      onClick: () => this.requestAccountExport(selected),
                      style: {
                        margin: '0px 5px',
                        width: '20px',
                        height: '20px',
                      },
                    }),
                  ]),
                ]),
              ]),
            ]),

            // account ballence

          ]),
        ]),
        h('.flex-row', {
          style: {
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          },
        }, [

          h(EtherBalance, {
            value: account && account.balance,
            mainBalance: true,
            style: {
              lineHeight: '7px',
              marginTop: '10px',
            },
          }),

          h('button', {
            onClick: () => props.dispatch(actions.buyEthSubview()),
            style: {
              marginBottom: '20px',
              marginRight: '8px',
              position: 'absolute',
              left: '219px',
            },
          }, props.accountDetail.subview === 'buyForm' ?  [h('i.fa.fa-arrow-left', {
            style: {
              width: '22.641px',
              height: '14px',
            },
          }), ] : 'BUY'),

          h('button', {
            onClick: () => props.dispatch(actions.showSendPage()),
            style: {
              marginBottom: '20px',
              marginRight: '8px',
            },
          }, 'SEND'),

        ]),
      ]),

      // subview (tx history, pk export confirm, buy eth warning)
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

AccountDetailScreen.prototype.subview = function () {
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
    case 'buyForm':
      var state = extend({key: 'buyForm'}, this.props)
      return h(BuyButtonSubview, state)
    default:
      return this.transactionList()
  }
}

AccountDetailScreen.prototype.transactionList = function () {
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
    viewPendingTx: (txId) => {
      this.props.dispatch(actions.viewPendingTx(txId))
    },
  })
}

AccountDetailScreen.prototype.requestAccountExport = function () {
  this.props.dispatch(actions.requestExportAccount())
}

AccountDetailScreen.prototype.buyButtonDeligator = function () {
  var props = this.props

  if (this.props.accountDetail.subview === 'buyForm') {
    props.dispatch(actions.backToAccountDetail(props.address))
  }else{
    props.dispatch(actions.buyEthSubview())
  }
}
