const inherits = require('util').inherits
const extend = require('xtend')
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const CopyButton = require('./components/copyButton')
const AccountInfoLink = require('./components/account-info-link')
const actions = require('./actions')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const valuesFor = require('./util').valuesFor

const Identicon = require('./components/identicon')
const EthBalance = require('./components/eth-balance')
const TransactionList = require('./components/transaction-list')
const ExportAccountView = require('./components/account-export')
const ethUtil = require('ethereumjs-util')
const EditableLabel = require('./components/editable-label')
const Tooltip = require('./components/tooltip')
const BuyButtonSubview = require('./components/buy-button-subview')
module.exports = connect(mapStateToProps)(AccountDetailScreen)

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    address: state.metamask.selectedAddress,
    accountDetail: state.appState.accountDetail,
    network: state.metamask.network,
    unconfMsgs: valuesFor(state.metamask.unconfMsgs),
    shapeShiftTxList: state.metamask.shapeShiftTxList,
    transactions: state.metamask.selectedAddressTxList
  }
}

inherits(AccountDetailScreen, Component)
function AccountDetailScreen () {
  Component.call(this)
}

AccountDetailScreen.prototype.render = function () {
  var props = this.props
  var selected = props.address || Object.keys(props.accounts)[0]
  var checksumAddress = selected && ethUtil.toChecksumAddress(selected)
  var identity = props.identities[selected]
  var account = props.accounts[selected]
  const { network } = props

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
              }, checksumAddress),

              // copy and export

              h('.flex-row', {
                style: {
                  justifyContent: 'flex-end',
                },
              }, [

                h(AccountInfoLink, { selected, network }),

                h(CopyButton, {
                  value: checksumAddress,
                }),

                h(Tooltip, {
                  title: 'QR Code',
                }, [
                  h('i.fa.fa-qrcode.pointer.pop-hover', {
                    onClick: () => props.dispatch(actions.showQrView(selected, identity ? identity.name : '')),
                    style: {
                      fontSize: '18px',
                      position: 'relative',
                      color: 'rgb(247, 134, 28)',
                      top: '5px',
                      marginLeft: '3px',
                      marginRight: '3px',
                    },
                  }),
                ]),

                h(Tooltip, {
                  title: 'Export Private Key',
                }, [
                  h('div', {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                    },
                  }, [
                    h('img.cursor-pointer.color-orange', {
                      src: 'images/key-32.png',
                      onClick: () => this.requestAccountExport(selected),
                      style: {
                        height: '19px',
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

          h(EthBalance, {
            value: account && account.balance,
            style: {
              lineHeight: '7px',
              marginTop: '10px',
            },
          }),

          h('button', {
            onClick: () => props.dispatch(actions.buyEthView(selected)),
            style: {
              marginBottom: '20px',
              marginRight: '8px',
              position: 'absolute',
              left: '219px',
            },
          }, 'BUY'),

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
      return h(BuyButtonSubview, extend({key: 'buyForm'}, this.props))
    default:
      return this.transactionList()
  }
}

AccountDetailScreen.prototype.transactionList = function () {
  const {transactions, unconfMsgs, address, network, shapeShiftTxList } = this.props
  return h(TransactionList, {
    transactions: transactions.sort((a, b) => b.time - a.time),
    network,
    unconfMsgs,
    address,
    shapeShiftTxList,
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
  var selected = props.address || Object.keys(props.accounts)[0]

  if (this.props.accountDetail.subview === 'buyForm') {
    props.dispatch(actions.backToAccountDetail(props.address))
  } else {
    props.dispatch(actions.buyEthView(selected))
  }
}
