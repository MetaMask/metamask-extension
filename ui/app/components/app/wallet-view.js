const Component = require('react').Component
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const inherits = require('util').inherits
const { checksumAddress } = require('../../helpers/utils/util')
// const AccountDropdowns = require('./dropdowns/index.js').AccountDropdowns
const actions = require('../../store/actions')
import BalanceComponent from '../ui/balance'
const TokenList = require('./token-list')
const selectors = require('../../selectors/selectors')
const { ADD_TOKEN_ROUTE } = require('../../helpers/constants/routes')

import AddTokenButton from './add-token-button'
import AccountDetails from './account-details'

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(WalletView)

WalletView.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

WalletView.defaultProps = {
  responsiveDisplayClassname: '',
}

function mapStateToProps (state) {

  return {
    network: state.metamask.network,
    sidebarOpen: state.appState.sidebar.isOpen,
    identities: state.metamask.identities,
    accounts: selectors.getMetaMaskAccounts(state),
    keyrings: state.metamask.keyrings,
    selectedAddress: selectors.getSelectedAddress(state),
    selectedAccount: selectors.getSelectedAccount(state),
    selectedTokenAddress: state.metamask.selectedTokenAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSendPage: () => dispatch(actions.showSendPage()),
    hideSidebar: () => dispatch(actions.hideSidebar()),
    unsetSelectedToken: () => dispatch(actions.setSelectedToken()),
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

WalletView.prototype.renderAddToken = function () {
  const {
    sidebarOpen,
    hideSidebar,
    history,
  } = this.props
  const { metricsEvent } = this.context

  return h(AddTokenButton, {
    onClick () {
      history.push(ADD_TOKEN_ROUTE)
      metricsEvent({
        eventOpts: {
          category: 'Navigation',
          action: 'Token Menu',
          name: 'Clicked "Add Token"',
        },
      })
      if (sidebarOpen) {
        hideSidebar()
      }
    },
  })
}

WalletView.prototype.render = function () {
  const {
    responsiveDisplayClassname,
    selectedAddress,
    keyrings,
    identities,
    network,
  } = this.props
  // temporary logs + fake extra wallets

  const checksummedAddress = checksumAddress(selectedAddress, network)

  if (!selectedAddress) {
    throw new Error('selectedAddress should not be ' + String(selectedAddress))
  }

  const keyring = keyrings.find((kr) => {
    return kr.accounts.includes(selectedAddress)
  })

  let label = ''
  let type
  if (keyring) {
    type = keyring.type
    if (type !== 'HD Key Tree') {
      if (type.toLowerCase().search('hardware') !== -1) {
        label = this.context.t('hardware')
      } else {
        label = this.context.t('imported')
      }
    }
  }

  return h('div.wallet-view.flex-column', {
    style: {},
    className: responsiveDisplayClassname,
  }, [

    h(AccountDetails, {
      label,
      checksummedAddress,
      name: identities[selectedAddress].name,
    }),

    this.renderWalletBalance(),

    h(TokenList),

    this.renderAddToken(),
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
