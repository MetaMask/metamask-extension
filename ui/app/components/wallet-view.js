const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const classnames = require('classnames')
const Identicon = require('./identicon')
// const AccountDropdowns = require('./dropdowns/index.js').AccountDropdowns
const Tooltip = require('./tooltip-v2.js')
const copyToClipboard = require('copy-to-clipboard')
const actions = require('../actions')
const BalanceComponent = require('./balance-component')
const TokenList = require('./token-list')
const selectors = require('../selectors')
const t = require('../../i18n')

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
  this.state = {
    hasCopied: false,
    copyToClipboardPressed: false,
  }
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

      h('div.wallet-view__keyring-label.allcaps', isLoose ? t('imported') : ''),

      h('div.flex-column.flex-center.wallet-view__name-container', {
        style: { margin: '0 auto' },
        onClick: showAccountDetailModal,
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

        h('button.btn-clear.wallet-view__details-button.allcaps', t('details')),
      ]),
    ]),

    h(Tooltip, {
      position: 'bottom',
      title: this.state.hasCopied ? t('copiedExclamation') : t('copyToClipboard'),
      wrapperClassName: 'wallet-view__tooltip',
    }, [
      h('button.wallet-view__address', {
        className: classnames({
          'wallet-view__address__pressed': this.state.copyToClipboardPressed,
        }),
        onClick: () => {
          copyToClipboard(selectedAddress)
          this.setState({ hasCopied: true })
          setTimeout(() => this.setState({ hasCopied: false }), 3000)
        },
        onMouseDown: () => {
          this.setState({ copyToClipboardPressed: true })
        },
        onMouseUp: () => {
          this.setState({ copyToClipboardPressed: false })
        },
      }, [
        `${selectedAddress.slice(0, 4)}...${selectedAddress.slice(-4)}`,
        h('i.fa.fa-clipboard', { style: { marginLeft: '8px' } }),
      ]),
    ]),

    this.renderWalletBalance(),

    h(TokenList),

    h('button.btn-clear.wallet-view__add-token-button', {
      onClick: () => {
        showAddTokenPage()
        hideSidebar()
      },
    }, t('addToken')),
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
