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
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSendPage: () => {dispatch(actions.showSendPage())},
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
      // width: '33.333%',
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: '230px', // .333*345
      height: '82vh',
      background: '#FAFAFA', // TODO: add to reusable colors
    }
  }, [

    // TODO: Separate component: wallet account details
    h('div.flex-row.flex-center', {
      style: {
        margin: '1.8em 1.3em',
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
          fontSize: '1.2em',
          marginLeft: '0.6em', // TODO: switch all units for this component to em
        }
      }, [
        'Account 1'
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

    // Buy Buttons
    // for index.css
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
        marginLeft: '1.3em',
        marginTop: '0.8em',
      }
    }, [
      h('div', {
        style: {
          border: '1px solid rgb(91, 93, 103)',
          borderRadius: '2px',
          height: '20px',
          width: '50px',
          fontSize: '0.8em',
          textAlign: 'center',
        }
      }, 'BUY'),
      h('div.wallet-btn', {
        onClick: () => {
          console.log("SHOW");
          this.props.showSendPage();
        },
        style: {
          border: '1px solid rgb(91, 93, 103)',
          borderRadius: '2px',
          height: '20px',
          width: '50px',
          fontSize: '0.8em',
          textAlign: 'center',
          marginLeft: '.6em',
        }
      }, 'SEND'),
    ]),

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
