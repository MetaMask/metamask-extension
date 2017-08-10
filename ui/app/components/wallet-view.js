const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const AccountDropdowns = require('./account-dropdowns').AccountDropdowns
const Content = require('./wallet-content-display')
const actions = require('../actions')
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
  const { network, responsiveDisplayClassname, style, identities, selectedAddress } = this.props

  return h('div.wallet-view.flex-column' + (responsiveDisplayClassname || ''), {
    style: {},
  }, [

    // TODO: Separate component: wallet account details
    h('div.flex-column', {
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
        style: {
          position: 'relative',
        },
      }, [

        h('.identicon-wrapper.select-none', {
          style: {
            marginBottom: '1%',
          },
        }, [
          h(Identicon, {
            diameter: 54,
            address: selectedAddress,
          }),
        ]),

        h('span.account-name', {
          style: {}
        }, [
          'Account 1'
        ]),

        h(AccountDropdowns, {
          style: {
            position: 'absolute',
            left: 'calc(50% + 28px + 5.5px)',
            top: '19.5%',
          },
          selected: selectedAddress,
          network,
          identities,
          enableAccountsSelector: true,
        }, []),
      ]),
    ]),

    h(Content, {
     title: 'Wallet',
     amount: '1001.124 ETH',
     fiatValue: '$300,000.00 USD',
     active: true,
    }),

    // Wallet contents
    h(Content, {
      title: "Total Token Balance",
      amount: "45.439 ETH",
      fiatValue: "$13,000.00 USD",
      active: false,
      style: {
        marginTop: '1.3em',
      }
    })
  ])
}
