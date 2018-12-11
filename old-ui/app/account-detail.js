const inherits = require('util').inherits
const extend = require('xtend')
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')
const { getCurrentKeyring, ifContractAcc, valuesFor } = require('./util')
const Identicon = require('./components/identicon')
const EthBalance = require('./components/eth-balance')
const TransactionList = require('./components/transaction-list')
const ExportAccountView = require('./components/account-export')
const ethUtil = require('ethereumjs-util')
const EditableLabel = require('./components/editable-label')
const TabBar = require('./components/tab-bar')
const TokenList = require('./components/token-list')
const AccountDropdowns = require('./components/account-dropdowns').AccountDropdowns
const CopyButton = require('./components/copyButton')

module.exports = connect(mapStateToProps)(AccountDetailScreen)

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    identities: state.metamask.identities,
    keyrings: state.metamask.keyrings,
    accounts: state.metamask.accounts,
    address: state.metamask.selectedAddress,
    accountDetail: state.appState.accountDetail,
    network: state.metamask.network,
    unapprovedMsgs: valuesFor(state.metamask.unapprovedMsgs),
    shapeShiftTxList: state.metamask.shapeShiftTxList,
    transactions: state.metamask.selectedAddressTxList || [],
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
    currentAccountTab: state.metamask.currentAccountTab,
    tokens: state.metamask.tokens,
    suggestedTokens: state.metamask.suggestedTokens,
    computedBalances: state.metamask.computedBalances,
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
  const { network, conversionRate, currentCurrency } = props

  if (Object.keys(props.suggestedTokens).length > 0) {
    this.props.dispatch(actions.showAddSuggestedTokenPage())
  }

  const currentKeyring = getCurrentKeyring(props.address, network, props.keyrings, props.identities)

  return (

    h('.account-detail-section.full-flex-height', [

    // identicon, label, balance, etc
      h('.account-data-subsection', {
        style: {
          padding: '30px',
          flex: '1 0 auto',
          background: 'linear-gradient(rgb(84, 36, 147), rgb(104, 45, 182))',
          width: '100%',
        },
      }, [

        // header - identicon + nav
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          },
        }, [

          // large identicon and addresses
          h('.identicon-wrapper.select-none', [
            h(Identicon, {
              diameter: 60,
              address: selected,
            }),
          ]),
          h('flex-column', {
            style: {
              lineHeight: '10px',
              marginLeft: '20px',
              width: '100%',
            },
          }, [
            h(EditableLabel, {
              textValue: identity ? identity.name : '',
              state: {
                isEditingLabel: false,
              },
              saveText: (text) => {
                props.dispatch(actions.setAccountLabel(selected, text))
              },
            }, [

              // What is shown when not editing + edit text:
              h('label.editing-label', [h('.edit-text', 'edit')]),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  },
                },
                [
                  h(
                    'div.font-medium.color-forest',
                    {
                      name: 'edit',
                      style: {
                      },
                    },
                    [
                      h('h2', {
                        style: {
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          padding: '5px 0px',
                          lineHeight: '25px',
                          color: '#ffffff',
                        },
                      }, [
                        identity && identity.name,
                      ]),
                    ]
                  ),
                  h(
                    AccountDropdowns,
                    {
                      style: {
                        marginRight: '10px',
                        marginLeft: 'auto',
                        cursor: 'pointer',
                      },
                      selected,
                      network,
                      identities: props.identities,
                      keyrings: props.keyrings,
                      enableAccountOptions: true,
                    },
                  ),
                ]
              ),
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
                  width: '8em',
                  display: 'inline-flex',
                  marginBottom: '15px',
                },
              }, [
                h('span', {style: {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingTop: '3px',
                  width: '5em',
                  height: '15px',
                  fontSize: '14px',
                  fontFamily: 'Nunito Bold',
                  textRendering: 'geometricPrecision',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}, checksumAddress),
                h(CopyButton, {
                  value: checksumAddress,
                  isWhite: true,
                }),
              ]),
            ]),

            // account ballance

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
            conversionRate,
            currentCurrency,
            network,
            style: {
              lineHeight: '7px',
            },
          }),

          h('.flex-grow'),

          h('button', {
            onClick: () => props.dispatch(actions.buyEthView(selected)),
            style: { marginRight: '10px' },
          }, 'Buy'),

          h('button', {
            onClick: () => {
              if (ifContractAcc(currentKeyring)) {
                return props.dispatch(actions.showSendContractPage({}))
              } else {
                return props.dispatch(actions.showSendPage())
              }
            },
          }, 'Send'),

        ]),
      ]),

      // subview (tx history, pk export confirm, buy eth warning)
      this.subview(),

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
      return this.tabSections()
    case 'export':
      var state = extend({key: 'export'}, this.props)
      return h(ExportAccountView, state)
    default:
      return this.tabSections()
  }
}

AccountDetailScreen.prototype.tabSections = function () {
  const { currentAccountTab } = this.props

  return h('section.tabSection.full-flex-height.grow-tenx', [

    h(TabBar, {
      tabs: [
        { content: 'Sent', key: 'history', id: 'wallet-view__tab-history' },
        { content: 'Tokens', key: 'tokens', id: 'wallet-view__tab-tokens' },
      ],
      defaultTab: currentAccountTab || 'history',
      tabSelected: (key) => {
        this.props.dispatch(actions.setCurrentAccountTab(key))
      },
    }),

    this.tabSwitchView(),
  ])
}

AccountDetailScreen.prototype.tabSwitchView = function () {
  const props = this.props
  const { address, network } = props
  const { currentAccountTab, tokens } = this.props

  switch (currentAccountTab) {
    case 'tokens':
      return h(TokenList, {
        userAddress: address,
        network,
        tokens,
        addToken: () => this.props.dispatch(actions.showAddTokenPage()),
        removeToken: (token) => this.props.dispatch(actions.showRemoveTokenPage(token)),
      })
    default:
      return this.transactionList()
  }
}

AccountDetailScreen.prototype.transactionList = function () {
  const {transactions, unapprovedMsgs, address,
    network, shapeShiftTxList, conversionRate } = this.props

  return h(TransactionList, {
    transactions: transactions.sort((a, b) => b.time - a.time),
    network,
    unapprovedMsgs,
    conversionRate,
    address,
    shapeShiftTxList,
    viewPendingTx: (txId) => {
      this.props.dispatch(actions.viewPendingTx(txId))
    },
  })
}
