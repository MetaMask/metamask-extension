const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const AccountDropdowns = require('./account-dropdowns').AccountDropdowns
const Content = require('./wallet-content-display')
const actions = require('../actions')

module.exports = connect(mapStateToProps, mapDispatchToProps)(WalletView)

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    sidebarOpen: state.appState.sidebarOpen,
    identities: state.metamask.identities,
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
  const selected = '0x82df11beb942BEeeD58d466fCb0F0791365C7684' // TODO: remove fake address
  const { network, responsiveDisplayClassname, style, identities } = this.props

  return h('div.wallet-view.flex-column' + (responsiveDisplayClassname || ''), {
    style: {},
  }, [

    // TODO: Separate component: wallet account details
    h('div.flex-column', {
      style: {}
    }, [

      h('div.flex-row.account-options-menu', {
      }, [

        h(AccountDropdowns, {
          // selected,
          // network,
          // identities: props.identities,
          enableAccountOptions: true,
        }, []),

      ]),

      h('div.flex-column.flex-center', {
        style: {
          // constrains size of absolutely positioned wrappers
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
            address: selected,
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
            // left: '42px',
            // top: '-10px'
            // left: '66.5%',
            top: '19.5%',
          },
          selected,
          network,
          identities,
          enableAccountsSelector: true,
        }, []),
      ]),

      h(
        AccountDropdowns,
        {
          style: {
            marginLeft: 'auto',
            cursor: 'pointer',
          },
          selected,
          network, // TODO: this prop could be in the account dropdown container
          identities: {},
        },
      ),

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
