const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
// const AccountDropdowns = require('./dropdowns/index.js').AccountDropdowns
const copyToClipboard = require('copy-to-clipboard')
const actions = require('../actions')
const BalanceComponent = require('./balance-component')
const TokenList = require('./token-list')
const selectors = require('../selectors')

module.exports = connect(mapStateToProps, mapDispatchToProps)(WalletView)

function mapStateToProps (state) {

  return {
    network: state.metamask.network,
    sidebarOpen: state.appState.sidebarOpen,
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    tokens: state.metamask.tokens,
    keyrings: state.metamask.keyrings,
    selectedAddress: selectors.getSelectedAddress(state),
    selectedIdentity: selectors.getSelectedIdentity(state),
    selectedAccount: selectors.getSelectedAccount(state),
    selectedTokenAddress: state.metamask.selectedTokenAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSendPage: () => dispatch(actions.showSendPage()),
    hideSidebar: () => dispatch(actions.hideSidebar()),
    unsetSelectedToken: () => dispatch(actions.setSelectedToken()),
    showAccountDetailModal: () => {
      dispatch(actions.showModal({ name: 'ACCOUNT_DETAILS' }))
    },
    showAddTokenPage: () => dispatch(actions.showAddTokenPage()),
  }
}

inherits(WalletView, Component)
function WalletView () {
  Component.call(this)
}

WalletView.prototype.renderWalletBalance = function () {
  const {
    selectedTokenAddress,
    selectedAccount,
    unsetSelectedToken,
    hideSidebar,
    sidebarOpen,
  } = this.props

  const selectedClass = selectedTokenAddress
    ? ''
    : 'wallet-balance-wrapper--active'
  const className = `flex-column wallet-balance-wrapper ${selectedClass}`

  return h('div', { className }, [
    h('div.wallet-balance',
      {
        onClick: () => {
          unsetSelectedToken()
          selectedTokenAddress && sidebarOpen && hideSidebar()
        },
      },
      [
        h(BalanceComponent, {
          balanceValue: selectedAccount ? selectedAccount.balance : '',
          style: {},
        }),
      ]
    ),
  ])
}

WalletView.prototype.render = function () {
  const {
    responsiveDisplayClassname,
    selectedAddress,
    selectedIdentity,
    keyrings,
    showAccountDetailModal,
    hideSidebar,
    showAddTokenPage,
  } = this.props
  // temporary logs + fake extra wallets
  // console.log('walletview, selectedAccount:', selectedAccount)

  const keyring = keyrings.find((kr) => {
    return kr.accounts.includes(selectedAddress) ||
      kr.accounts.includes(selectedIdentity.address)
  })

  const type = keyring.type
  const isLoose = type !== 'HD Key Tree'

  return h('div.wallet-view.flex-column' + (responsiveDisplayClassname || ''), {
    style: {},
  }, [

    // TODO: Separate component: wallet account details
    h('div.flex-column.wallet-view-account-details', {
      style: {},
    }, [
      h('div.wallet-view__sidebar-close', {
        onClick: hideSidebar,
      }),

      h('div.wallet-view__keyring-label', isLoose ? 'IMPORTED' : ''),

      h('div.flex-column.flex-center', {
        style: { margin: '0 auto' },
      }, [
        h(Identicon, {
          diameter: 54,
          address: selectedAddress,
        }),

        h('span.account-name', {
          style: {},
        }, [
          selectedIdentity.name,
        ]),
      ]),
    ]),

    h('button.wallet-view__details-button', { onClick: showAccountDetailModal }, 'DETAILS'),

    h('div.wallet-view__address', { onClick: () => copyToClipboard(selectedAddress) }, [
      `${selectedAddress.slice(0, 4)}...${selectedAddress.slice(-4)}`,
      h('i.fa.fa-clipboard', { style: { marginLeft: '8px' } }),
    ]),

    // 'Wallet' - Title
    // Not visible on mobile
    h('div.flex-column.wallet-view-title-wrapper', [
      h('span.wallet-view-title', [
        'Wallet',
      ]),
    ]),

    this.renderWalletBalance(),

    h(TokenList),

    h('button.wallet-view__add-token-button', {
      onClick: showAddTokenPage,
    }, 'Add Token'),
  ])
}

// TODO: Extra wallets, for dev testing. Remove when PRing to master.
// const extraWallet = h('div.flex-column.wallet-balance-wrapper', {}, [
//     h('div.wallet-balance', {}, [
//       h(BalanceComponent, {
//         balanceValue: selectedAccount.balance,
//         style: {},
//       }),
//     ]),
// ])
