const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const AccountDropdowns = require('./account-dropdowns').AccountDropdowns
const Content = require('./wallet-content-display')

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

    // TODO: Separate component: wallet-content-account
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
    // for index.css
    // 
    // TODO: move into a class
    // div.wallet-btn {
    //   border: 1px solid rgb(91, 93, 103);
    //   border-radius: 2px;
    //   height: 30px;
    //   width: 75px;
    //   font-size: 0.8em;
    //   text-align: center;
    //   line-height: 25px;
    // }

    h('div.flex-row', {
      style: {
        marginLeft: '35px',
        marginTop: '10px',
      }
    }, [
      h('div', {
        style: {
          border: '1px solid rgb(91, 93, 103)',
          borderRadius: '2px',
          height: '30px',
          width: '75px',
          fontSize: '0.8em',
          textAlign: 'center',
          lineHeight: '25px',
        }
      }, 'BUY'),
      h('div.wallet-btn', {
        style: {
          border: '1px solid rgb(91, 93, 103)',
          borderRadius: '2px',
          height: '30px',
          width: '75px',
          fontSize: '0.8em',
          textAlign: 'center',
          lineHeight: '25px',
          // spacing...
          marginLeft: '15px',
        }
      }, 'SEND'),
    ]),

    // Wallet contents
    h(Content, {
      title: "Total Token Balance",
      amount: "45.439 ETH",
      fiatValue: "$13,000.00 USD",
      active: false,
    })

  ])
}
