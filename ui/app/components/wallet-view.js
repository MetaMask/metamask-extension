const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const AccountDropdowns = require('./dropdowns/index.js').AccountDropdowns
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
    selectedAddress: selectors.getSelectedAddress(state),
    selectedIdentity: selectors.getSelectedIdentity(state),
    selectedAccount: selectors.getSelectedAccount(state),
    selectedTokenAddress: state.metamask.selectedTokenAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSendPage: () => { dispatch(actions.showSendPage()) },
    hideSidebar: () => { dispatch(actions.hideSidebar()) },
    unsetSelectedToken: () => dispatch(actions.setSelectedToken()),
  }
}

inherits(WalletView, Component)
function WalletView () {
  Component.call(this)
}

WalletView.prototype.renderWalletBalance = function () {
  const { selectedTokenAddress, selectedAccount, unsetSelectedToken } = this.props
  const selectedClass = selectedTokenAddress
    ? ''
    : 'wallet-balance-wrapper--active'
  const className = `flex-column wallet-balance-wrapper ${selectedClass}`

  return h('div', { className }, [
    h('div.wallet-balance',
      {
        onClick: () => unsetSelectedToken(),
      },
      [
        h(BalanceComponent, {
          balanceValue: selectedAccount.balance,
          style: {},
        }),
      ]
    ),
  ])
}

WalletView.prototype.render = function () {
  const {
    network, responsiveDisplayClassname, identities,
    selectedAddress, selectedAccount, accounts,
    selectedIdentity,
  } = this.props
  // temporary logs + fake extra wallets
  console.log('walletview, selectedAccount:', selectedAccount)

  return h('div.wallet-view.flex-column' + (responsiveDisplayClassname || ''), {
    style: {},
  }, [

    // TODO: Separate component: wallet account details
    h('div.flex-column.wallet-view-account-details', {
      style: {},
    }, [

      h('div.flex-row.account-options-menu', {
        style: {
          position: 'relative',
        },
      }, [

        h(AccountDropdowns, {
          selected: selectedAddress,
          network,
          identities,
          useCssTransition: true,
          enableAccountOptions: true,
          dropdownWrapperStyle: {
            padding: '1px 15px',
            marginLeft: '-25px',
            position: 'absolute',
            width: '122%', // TODO, refactor all of this component out into media queries
          },
          menuItemStyles: {
            padding: '0px 0px',
            margin: '22px 0px',
          },
        }, []),

      ]),

      h('div.flex-column.flex-center', {
      }, [
        h('div', {
          style: {
            position: 'relative',
          },
        }, [
          h(AccountDropdowns, {
            accounts,
            style: {
              position: 'absolute',
              left: 'calc(50% + 28px + 5.5px)',
              top: '14px',
            },
            innerStyle: {
              padding: '10px 16px',
            },
            useCssTransition: true,
            selected: selectedAddress,
            network,
            identities,
            enableAccountsSelector: true,
          }, []),
        ]),

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

    // 'Wallet' - Title
    // Not visible on mobile
    h('div.flex-column.wallet-view-title-wrapper', {}, [
      h('span.wallet-view-title', {}, [
        'Wallet',
      ]),
    ]),

    this.renderWalletBalance(),

    h(TokenList),

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
