const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const ethUtil = require('ethereumjs-util')
const inherits = require('util').inherits
const actions = require('../actions')

const BalanceComponent = require('./balance-component')
const TxList = require('./tx-list')
const Identicon = require('./identicon')

module.exports = connect(mapStateToProps, mapDispatchToProps)(TxView)

function mapStateToProps (state) {
  const sidebarOpen = state.appState.sidebarOpen

  const identities = state.metamask.identities
  const accounts = state.metamask.accounts
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  const checksumAddress = selectedAddress && ethUtil.toChecksumAddress(selectedAddress)
  const identity = identities[selectedAddress]
  const account = accounts[selectedAddress]

  return {
    sidebarOpen,
    selectedAddress,
    checksumAddress,
    identity,
    account,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSidebar: () => { dispatch(actions.showSidebar()) },
    hideSidebar: () => { dispatch(actions.hideSidebar()) },
    showModal: (payload) => { dispatch(actions.showModal(payload)) },
    showSendPage: () => { dispatch(actions.showSendPage()) },
  }
}

inherits(TxView, Component)
function TxView () {
  Component.call(this)
}

TxView.prototype.render = function () {

  const { selectedAddress, identity, account } = this.props

  return h('div.tx-view.flex-column', {
    style: {},
  }, [

    h('div.flex-row.phone-visible', {
      style: {
        margin: '1em 0.9em',
        alignItems: 'center',
      },
      onClick: () => {
        this.props.sidebarOpen ? this.props.hideSidebar() : this.props.showSidebar()
      },
    }, [

      h('div.fa.fa-bars', {
        style: {
          fontSize: '1.3em',
        },
      }, []),

      h('.identicon-wrapper.select-none', {
        style: {
          marginLeft: '0.9em',
        },
      }, [
        h(Identicon, {
          diameter: 24,
          address: selectedAddress,
        }),
      ]),

      h('span.account-name', {
        style: {},
      }, [
        identity.name,
      ]),

    ]),

    h('div.hero-balance', {
      style: {},
    }, [

      h(BalanceComponent, {
        balanceValue: account && account.balance,
        style: {},
      }),

      h('div.flex-row.flex-center.hero-balance-buttons', {
        style: {},
      }, [
        h('button.btn-clear', {
          style: {
            textAlign: 'center',
          },
          onClick: () => {
            this.props.showModal({
              name: 'BUY',
            })
          },
        }, 'BUY'),

        h('button.btn-clear', {
          style: {
            textAlign: 'center',
            marginLeft: '0.8em',
          },
          onClick: () => {
            this.props.showSendPage()
          },
        }, 'SEND'),

      ]),
    ]),

    h(TxList, {}),

  ])
}
