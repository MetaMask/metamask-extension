const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const AccountDropdowns = require('./account-dropdowns').AccountDropdowns

module.exports = connect(mapStateToProps)(WalletView)

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
  }
}


inherits(WalletView, Component)
function WalletView () {
  Component.call(this)
}

const noop = () => {}

WalletView.prototype.render = function () {
  const selected = '0x82df11beb942BEeeD58d466fCb0F0791365C7684'
  const { network } = this.props

  return h('div.wallet-view.flex-column', {
    style: {
      flexGrow: 1,
      height: '82vh',
      background: '#FAFAFA', // TODO: add to reusable colors
    }
  }, [

    // TODO: Separate component: wallet account details
    h('div.flex-row.flex-center', {
      style: {
        marginLeft: '35px',
        marginRight: '35px',
        marginTop: '35px',
      }
    }, [

      h('.identicon-wrapper.select-none', [
        h(Identicon, {
          diameter: 24,
          address: selected,
        }),
      ]),

      h('span', {
        style: {
          fontSize: '1.5em',
          marginLeft: '10px', // TODO: switch all units for this component to em
        }
      }, [
        'Account 1'
      ]),

      h(
        AccountDropdowns,
        {
          style: {
            marginRight: '8px',
            marginLeft: 'auto',
            cursor: 'pointer',
          },
          selected,
          network, // TODO: this prop could be in the account dropdown container
          identities: {},
        },
      ),

    ]),

    // TODO: Separate component: wallet contents
    h('div.flex-column', {
      style: {
        marginLeft: '35px',
        marginTop: '15px',
        alignItems: 'flex-start',
      }
    }, [

      h('span', {
        style: {
          fontSize: '1.1em',
        },
      }, 'Wallet'),

      h('span', {
        style: {
          fontSize: '1.8em',
          margin: '10px 0px',
        },
      }, '1001.124 ETH'),

      h('span', {
        style: {
          fontSize: '1.3em',
        },
      }, '$300,000.00 USD'),

      h('div', {
        style: {
          position: 'absolute',
          marginLeft: '-35px',
          height: '6em',
          width: '4px',
          background: '#D8D8D8', // TODO: add to resuable colors
        }
      }, [
      ])
    ]),

    // Buy Buttons



    // Wallet contents

  ])
}
