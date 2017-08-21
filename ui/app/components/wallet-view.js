const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const AccountDropdowns = require('./dropdowns/index.js').AccountDropdowns
const Content = require('./wallet-content-display')
const actions = require('../actions')
const BalanceComponent = require('./balance-component')
const selectors = require('../selectors')

module.exports = connect(mapStateToProps, mapDispatchToProps)(WalletView)

function mapStateToProps (state) {

  return {
    network: state.metamask.network,
    sidebarOpen: state.appState.sidebarOpen,
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    selectedAddress: selectors.getSelectedAddress(state),
    selectedIdentity: selectors.getSelectedIdentity(state),
    selectedAccount: selectors.getSelectedAccount(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSendPage: () => {dispatch(actions.showSendPage())},
    hideSidebar: () => {dispatch(actions.hideSidebar())},
  }
}

inherits(WalletView, Component)
function WalletView () {
  Component.call(this)
}

const noop = () => {}

WalletView.prototype.render = function () {
  const { network, responsiveDisplayClassname, style, identities, selectedAddress, selectedAccount, accounts, selectedIdentity } = this.props
  // temporary logs + fake extra wallets
  console.log("walletview, selectedAccount:", selectedAccount)

  const extraWallet = h('div.flex-column.wallet-balance-wrapper', {}, [
      h('div.wallet-balance', {}, [
        h(BalanceComponent, {
          balanceValue: selectedAccount.balance,
          style: {},
        }),
      ]),
  ])

  return h('div.wallet-view.flex-column' + (responsiveDisplayClassname || ''), {
    style: {},
  }, [

    // TODO: Separate component: wallet account details
    h('div.flex-column.wallet-view-account-details', {
      style: {}
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
            width: '122%', //TODO, refactor all of this component out into media queries
          },
          menuItemStyles: {
            padding: '0px 0px',
            margin: '22px 0px',
          }
        }, []),

      ]),

      h('div.flex-column.flex-center', {
      }, [
        h('div', {
          style: {
            position: 'relative',
          }
        }, [
          h(AccountDropdowns, {
            accounts,
            style: {
              position: 'absolute',
              left: 'calc(50% + 28px + 5.5px)',
              top: '14px',
            },
            innerStyle: {
              padding: '2px 16px',
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
          style: {}
        }, [
          selectedIdentity.name
        ]),

      ]),
    ]),

    //'Wallet' - Title
    // Not visible on mobile
    h('div.flex-column.wallet-view-title-wrapper', {}, [
      h('span.wallet-view-title', {}, [
        'Wallet',
      ])
    ]),

    //Wallet Balances
    h('div.flex-column.wallet-balance-wrapper.wallet-balance-wrapper-active', {}, [

        h('div.wallet-balance', {}, [

          h(BalanceComponent, {
            balanceValue: selectedAccount.balance,
            style: {},
          }),

        ]),

    ]),

    h('div.flex-column.wallet-balance-wrapper', {}, [

        h('div.wallet-balance', {}, [

          h(BalanceComponent, {
            balanceValue: selectedAccount.balance,
            style: {},
          }),

        ]),

    ]),

    extraWallet,
    extraWallet,
    extraWallet,
    extraWallet,
    extraWallet,
    extraWallet,
    extraWallet,
    extraWallet,
    extraWallet,
    extraWallet,
  ])
}
