const inherits = require('util').inherits
const PersistentForm = require('../lib/persistent-form')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const Identicon = require('./components/identicon')
const actions = require('./actions')
const util = require('./util')
const numericBalance = require('./util').numericBalance
const addressSummary = require('./util').addressSummary
const isHex = require('./util').isHex
const EthBalance = require('./components/eth-balance')
const EnsInput = require('./components/ens-input')
const ethUtil = require('ethereumjs-util')
const { getSelectedIdentity } = require('./selectors')

const ARAGON = '960b236A07cf122663c4303350609A66A7B288C0'

module.exports = connect(mapStateToProps)(SendTransactionScreen)

function mapStateToProps (state) {
  var result = {
    selectedIdentity: getSelectedIdentity(state),
    address: state.metamask.selectedAddress,
    accounts: state.metamask.accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
    network: state.metamask.network,
    addressBook: state.metamask.addressBook,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
  }

  result.error = result.warning && result.warning.split('.')[0]

  result.account = result.accounts[result.address]
  result.identity = result.identities[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

inherits(SendTransactionScreen, PersistentForm)
function SendTransactionScreen () {
  PersistentForm.call(this)

  // [WIP] These are the bare minimum of tx props needed to sign a transaction
  // We will need a few more for contract-related interactions
  this.state = {
    newTx: {
      from: '',
      to: '',
      // these values are hardcoded, so "Next" can be clicked
      amount: '0.0001', // see L544
      gasPrice: '4a817c800',
      gas: '0x7b0d',
    },
  }
}

SendTransactionScreen.prototype.render = function () {
  this.persistentFormParentId = 'send-tx-form'

  const props = this.props
  const {
    selectedIdentity,
    address,
    account,
    identity,
    network,
    identities,
    addressBook,
    conversionRate,
    currentCurrency,
  } = props

  console.log({ selectedIdentity, identities })
  console.log("SendTransactionScreen state:", this.state)

  return (

    h('div.send-screen-wrapper', {
      style: {},
    }, [

      // Main Send token Card
      h('div.send-screen-card', {
        style: {}
      }, [

        h('img.send-eth-icon', {
          src: '../images/eth_logo.svg',
          style: {},
        }),

        h('div', {}, [
          'Send'
        ]),

        h('div', {
          style: {
            textAlign: 'center',
          },
        }, [
          'Send Ethereum to anyone with an Ethereum account'
        ]),

        h('div.send-screen-input-wrapper', {}, [

          h('div', {}, [
            'From:'
          ]),

          h('input.large-input.send-screen-input', {
            list: 'accounts',
            placeholder: 'Account',
            value: this.state.from,
            onChange: (event) => {
              console.log("event", event.target.value)
              this.setState({
                newTx: Object.assign(
                  this.state.newTx,
                  {
                    from: event.target.value,
                  }
                ),
              })
            },
          }, [
          ]),

          h('datalist#accounts', {}, [
            Object.keys(props.identities).map((key) => {
              const identity = props.identities[key]
              return h('option', {
                value: identity.address,
                label: identity.name,
                key: identity.address,
              })
            }),
          ]),

        ]),

        h('div.send-screen-input-wrapper', {}, [

          h('div', {}, [
            'To:'
          ]),

          h(EnsInput, {
            name: 'address',
            placeholder: 'Recipient Address',
            onChange: () => {
              console.log("event", event.target.value)
              this.setState({
                newTx: Object.assign(
                  this.state.newTx,
                  {
                    to: event.target.value,
                  }
                ),
              })
            },
            network,
            identities,
            addressBook,
          }),

        ]),

        h('div.send-screen-input-wrapper', {}, [

          h('div.send-screen-amount-labels', {}, [
            h('span', {}, ['Amount']),
            h('span', {}, ['ETH <> USD']), //holding on icon from design
          ]),

          h('input.large-input.send-screen-input', {
            placeholder: '0 ETH',
            type: 'number',
            onChange: () => {
              this.setState({
                newTx: Object.assign(
                  this.state.newTx,
                  {
                    amount: event.target.value,
                  }
                ),
              })
            }
          }, []),

        ]),

        h('div.send-screen-input-wrapper', {}, [

          h('div.send-screen-gas-labels', {}, [
            h('span', {}, [
              h('i.fa.fa-bolt', {}, []),

              // not working ATM.
              // Ship with fa-bolt if it's slowing us down...
              // h('img.send-screen-bolt-icon', {
              //   src: '../images/mm_bolt.svg',
              //   style: {},
              // }, []),

              'Gas fee:',
            ]),
            h('span', {}, ['What\'s this?']),
          ]),

          h('input.large-input.send-screen-gas-input', {
            placeholder: '0',
          }, []),

        ]),

        h('div.send-screen-input-wrapper', {}, [

          h('div', {}, ['Transaction memo (optional)']),

          h('input.large-input.send-screen-input', {}, [
          ]),

        ]),

      ]),

      // Buttons underneath card
      h('section.flex-column.flex-center', [

        h('button.btn-light', {
          onClick: this.onSubmit.bind(this),
          style: {
            marginTop: '8px',
            width: '8em',
            background: '#FFFFFF'
          },
        }, 'Next'),

        h('button.btn-light', {
          onClick: this.back.bind(this),
          style: {
            background: '#F7F7F7', // $alabaster
            border: 'none',
            opacity: 1,
            width: '8em',
          },
        }, 'Cancel'),
      ]),
    ])

  )
}

// WIP - hyperscript for renderSendToken - hook up later - can take pieces to re-implement
SendTransactionScreen.prototype.renderSendToken = function () {
  this.persistentFormParentId = 'send-tx-form'

  const props = this.props
  const {
    address,
    account,
    identity,
    network,
    identities,
    addressBook,
    conversionRate,
    currentCurrency,
  } = props

  return (

    h('div.flex-column.flex-grow', {
      style: {
        minWidth: '355px', // TODO: maxWidth TBD, use home.html
      },
    }, [

      // Main Send token Card
      h('div.send-screen.flex-column.flex-grow', {
        style: {
          marginLeft: '3.5%',
          marginRight: '3.5%',
          background: '#FFFFFF', // $background-white
          boxShadow: '0 2px 4px 0 rgba(0,0,0,0.08)',
        }
      }, [
        h('section.flex-center.flex-row', {
          style: {
            zIndex: 15, // $token-icon-z-index
            marginTop: '-35px',
          }
        }, [
          h(Identicon, {
            address: ARAGON,
            diameter: 76,
          }),
        ]),

        h('h3.flex-center', {
          style: {
            marginTop: '-18px',
            fontSize: '16px',
          },
        }, [
          'Send Tokens',
        ]),

        h('h3.flex-center', {
          style: {
            textAlign: 'center',
            fontSize: '12px',
          },
        }, [
          'Send Tokens to anyone with an Ethereum account',
        ]),

        h('h3.flex-center', {
          style: {
            textAlign: 'center',
            marginTop: '2px',
            fontSize: '12px',
          },
        }, [
          'Your Aragon Token Balance is:',
        ]),

        h('h3.flex-center', {
          style: {
            textAlign: 'center',
            fontSize: '36px',
            marginTop: '8px',
          },
        }, [
          '2.34',
        ]),

        h('h3.flex-center', {
          style: {
            textAlign: 'center',
            fontSize: '12px',
            marginTop: '4px',
          },
        }, [
          'ANT',
        ]),

        // error message
        props.error && h('span.error.flex-center', props.error),

        // 'to' field
        h('section.flex-row.flex-center', {
          style: {
            fontSize: '12px',
          },
        }, [
          h(EnsInput, {
            name: 'address',
            placeholder: 'Recipient Address',
            onChange: this.recipientDidChange.bind(this),
            network,
            identities,
            addressBook,
          }),
        ]),

        // 'amount' and send button
        h('section.flex-column.flex-center', [
          h('div.flex-row.flex-center', {
            style: {
              fontSize: '12px',
              width: '100%',
              justifyContent: 'space-between',
            }
          },[
            h('span', { style: {} }, ['Amount']),
            h('span', { style: {} }, ['Token <> USD']),
          ]),

          h('input.large-input', {
            name: 'amount',
            placeholder: '0',
            type: 'number',
            style: {
              marginRight: '6px',
              fontSize: '12px',
            },
            dataset: {
              persistentFormId: 'tx-amount',
            },
          }),

        ]),

        h('section.flex-column.flex-center', [
          h('div.flex-row.flex-center', {
            style: {
              fontSize: '12px',
              width: '100%',
              justifyContent: 'space-between',
            }
          },[
            h('span', { style: {} }, ['Gas Fee:']),
            h('span', { style: { fontSize: '8px' } }, ['What\'s this?']),
          ]),

          h('input.large-input', {
            name: 'Gas Fee',
            placeholder: '0',
            type: 'number',
            style: {
              fontSize: '12px',
              marginRight: '6px',
            },
            // dataset: {
            //   persistentFormId: 'tx-amount',
            // },
          }),

        ]),

        h('section.flex-column.flex-center', {
          style: {
            marginBottom: '10px',
          },
        }, [
          h('div.flex-row.flex-center', {
            style: {
              fontSize: '12px',
              width: '100%',
              justifyContent: 'flex-start',
            }
          },[
            h('span', { style: {} }, ['Transaction Memo (optional)']),
          ]),

          h('input.large-input', {
            name: 'memo',
            placeholder: '',
            type: 'string',
            style: {
              marginRight: '6px',
            },
          }),
        ]),
      ]),

      // Buttons underneath card
      h('section.flex-column.flex-center', [

        h('button.btn-light', {
          onClick: this.onSubmit.bind(this),
          style: {
            marginTop: '8px',
            width: '8em',
            background: '#FFFFFF'
          },
        }, 'Next'),

        h('button.btn-light', {
          onClick: this.back.bind(this),
          style: {
            background: '#F7F7F7', // $alabaster
            border: 'none',
            opacity: 1,
            width: '8em',
          },
        }, 'Cancel'),
      ]),
    ])

  )
}

SendTransactionScreen.prototype.navigateToAccounts = function (event) {
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

SendTransactionScreen.prototype.back = function () {
  var address = this.props.address
  this.props.dispatch(actions.backToAccountDetail(address))
}

SendTransactionScreen.prototype.recipientDidChange = function (recipient, nickname) {
  this.setState({
    recipient: recipient,
    nickname: nickname,
  })
}

SendTransactionScreen.prototype.onSubmit = function () {
  const state = this.state || {}

  // const recipient = state.recipient || document.querySelector('input[name="address"]').value.replace(/^[.\s]+|[.\s]+$/g, '')
  const recipient = state.newTx.to

  const nickname = state.nickname || ' '

  // const input = document.querySelector('input[name="amount"]').value
  // const input = state.newTx.value
  // const value = util.normalizeEthStringToWei(input)

  // https://consensys.slack.com/archives/G1L7H42BT/p1503439134000169?thread_ts=1503438076.000411&cid=G1L7H42BT
  // From @kumavis: "not needed for MVP but we will end up adding it again so consider just adding it now"
  const txData = false;
  // Must replace with memo data.
  // const txData = document.querySelector('input[name="txData"]').value

  const balance = this.props.balance
  let message

  // if (value.gt(balance)) {
  //   message = 'Insufficient funds.'
  //   return this.props.dispatch(actions.displayWarning(message))
  // }

  // if (input < 0) {
  //   message = 'Can not send negative amounts of ETH.'
  //   return this.props.dispatch(actions.displayWarning(message))
  // }

  // if ((!util.isValidAddress(recipient) && !txData) || (!recipient && !txData)) {
  //   message = 'Recipient address is invalid.'
  //   return this.props.dispatch(actions.displayWarning(message))
  // }

  if (txData && !isHex(ethUtil.stripHexPrefix(txData))) {
    message = 'Transaction data must be hex string.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  this.props.dispatch(actions.hideWarning())

  this.props.dispatch(actions.addToAddressBook(recipient, nickname))

  // var txParams = {
  //   // from: this.props.address,
  //   from: this.state.newTx.to,

  //   // value: '0x' + value.toString(16),
  //   value: '0x38d7ea4c68000', // hardcoded

  //   // New: gas will now be specified on this step
  //   gas: this.state.newTx.gas,
  //   gasPrice: this.state.newTx.gasPrice
  // }

  // Hardcoded
  var txParams =  {
    from: '0x82df11beb942beeed58d466fcb0f0791365c7684',
    to: '0xa43126b621db5b4fd98f959d9e5499f655913d34',
    value: '0x0',
  }

  if (recipient) txParams.to = ethUtil.addHexPrefix(recipient)
  if (txData) txParams.data = txData

  this.props.dispatch(actions.signTx(txParams))
}
