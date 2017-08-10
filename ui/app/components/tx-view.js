const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const ethUtil = require('ethereumjs-util')
const inherits = require('util').inherits
const actions = require('../actions')
// slideout menu
const WalletView = require('./wallet-view')

// balance component
const BalanceComponent = require('./balance-component')

// tx list
const TxList = require('./tx-list')

const Identicon = require('./identicon')
// const AccountDropdowns = require('./account-dropdowns').AccountDropdowns
// const Content = require('./wallet-content-display')

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
    showModal: () => { dispatch(actions.showModal()) },
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
      // burger
      h('div.fa.fa-bars', {
        style: {
          fontSize: '1.3em',
        },
      }, []),

      // account display
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

    // laptop: flex-row, flex-center
    // mobile: flex-column
    h('div.hero-balance', {
      style: {},
    }, [

      h(BalanceComponent, {
        balanceValue: account && account.balance,
        style: {},
      }),

      // laptop: 10vw?
      // phone: 75vw?
      h('div.flex-row.flex-center.hero-balance-buttons', {
        style: {},
      }, [
        h('button.btn-clear', {
          style: {
            textAlign: 'center',
          },
          onClick: () => {
            this.props.showModal()
          },
        }, 'BUY'),

        h('button.btn-clear', {
          style: {
            textAlign: 'center',
            marginLeft: '1.4em',
          },
        }, 'SEND'),

      ]),
    ]),

    h(TxList, {}),

  ])
}
