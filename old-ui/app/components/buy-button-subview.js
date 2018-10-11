const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')
const CoinbaseForm = require('./coinbase-form')
const ShapeshiftForm = require('./shapeshift-form')
const Loading = require('./loading')
const AccountPanel = require('./account-panel')
const RadioList = require('./custom-radio-list')
const { getNetworkDisplayName } = require('../../../app/scripts/controllers/network/util')
const ethNetProps = require('eth-net-props')

module.exports = connect(mapStateToProps)(BuyButtonSubview)

function mapStateToProps (state) {
  return {
    identity: state.appState.identity,
    account: state.metamask.accounts[state.appState.buyView.buyAddress],
    warning: state.appState.warning,
    buyView: state.appState.buyView,
    network: state.metamask.network,
    provider: state.metamask.provider,
    context: state.appState.currentView.context,
    isSubLoading: state.appState.isSubLoading,
  }
}

inherits(BuyButtonSubview, Component)
function BuyButtonSubview () {
  Component.call(this)
}

BuyButtonSubview.prototype.render = function () {
  return (
    h('div', {
      style: {
        width: '100%',
      },
    }, [
      this.headerSubview(),
      this.primarySubview(),
    ])
  )
}

BuyButtonSubview.prototype.headerSubview = function () {
  const props = this.props
  const { network } = props
  const isLoading = props.isSubLoading
  const coinName = ethNetProps.props.getNetworkCoinName(network)
  return (

    h('.flex-column', {
      style: {
        alignItems: 'center',
      },
    }, [

      // loading indication
      h('div', {
        style: {
          position: 'absolute',
          top: '57vh',
          left: '49vw',
        },
      }, [
        h(Loading, { isLoading }),
      ]),

      // account panel
      h('div', {
        style: {
          width: '100%',
        },
      }, [
        h(AccountPanel, {
          showFullAddress: true,
          identity: props.identity,
          account: props.account,
          network: props.network,
        }),
      ]),

      // header bar (back button, label)
      h('.flex-row.section-title', {
        style: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }, [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.backButtonContext.bind(this),
          style: {
            position: 'absolute',
            left: '30px',
          },
        }),
        h('h2.flex-center', {
          style: {
            width: '100vw',
            background: '#ffffff',
            color: '#333333',
            paddingTop: '4px',
            paddingBottom: '4px',
          },
        }, `Buy ${coinName}`),
      ]),

      h('.flex-row', {
        style: {
          alignItems: 'center',
          width: '100%',
        },
      }, [
        h('h3.flex-center', {
          style: {
            width: '100%',
            background: '#ffffff',
            color: '#333333',
            paddingLeft: '30px',
            justifyContent: 'left',
            fontFamily: 'Nunito Semibold',
          },
        }, 'Select Service'),
      ]),

    ])

  )
}


BuyButtonSubview.prototype.primarySubview = function () {
  const props = this.props
  const network = props.network

  switch (network) {
    case 'loading':
      return

    case '1':
      return this.mainnetSubview()

    // Ropsten, Rinkeby, Kovan, Sokol, POA, DAI
    case '3':
    case '4':
    case '42':
    case '77':
    case '99':
    case '100':
      const networkName = getNetworkDisplayName(network)
      const label = `${networkName} Test Faucet`
      return (
        h('div.flex-column', {
          style: {
            margin: '20px 30px',
          },
        }, [
          network !== '99' && network !== '100' ? h('p.exchanges.cursor-pointer', {
            onClick: () => this.props.dispatch(actions.buyEth({ network })),
          },
            [h('span', {style: {marginRight: '10px', color: '#6729a8'}}, label)]) : null,
          network === '99' ? h('p.exchanges.cursor-pointer', {
            onClick: () => this.props.dispatch(actions.buyEth({ network, exchange: 'binance' })),
          }, [h('span', {style: {marginRight: '10px', color: '#6729a8'}}, 'Binance')]) : null,
          network === '99' ? h('p.exchanges.cursor-pointer', {
            onClick: () => this.props.dispatch(actions.buyEth({ network, exchange: 'bibox' })),
          }, [h('span', {style: {marginRight: '10px', color: '#6729a8'}}, 'BiBox')]) : null,
          network === '99' ? h('p.exchanges.cursor-pointer', {
            onClick: () => this.props.dispatch(actions.buyEth({ network, exchange: 'cex.plus' })),
          }, [h('span', {style: {marginRight: '10px', color: '#6729a8'}}, 'CEX Plus')]) : null,
          // Kovan only: Dharma loans beta
          network === '42' ? (
            h('p.exchanges.cursor-pointer', {
              onClick: () => this.navigateTo('https://borrow.dharma.io/'),
            }, [h('span', {style: {marginRight: '10px', color: '#6729a8'}}, 'Borrow With Dharma (Beta)')])
          ) : null,
      ])
    )

    default:
      return (
        h('div', {
          style: {
            padding: '20px 30px',
          }},
          h('h2.error', 'Unknown network ID')
        )
      )

  }
}

BuyButtonSubview.prototype.mainnetSubview = function () {
  const props = this.props

  return (

    h('.flex-column', [

      h('.flex-row.selected-exchange', {
        style: {
          position: 'relative',
          marginLeft: '30px',
          marginTop: '20px',
          marginBottom: '20px',
        },
      }, [
        h(RadioList, {
          defaultFocus: props.buyView.subview,
          labels: [
            'Coinbase',
            'ShapeShift',
          ],
          subtext: {
            'Coinbase': 'Crypto/FIAT (USA only)',
            'ShapeShift': 'Crypto',
          },
          onClick: this.radioHandler.bind(this),
        }),
      ]),

      h('h3', {
        style: {
          padding: '20px 30px',
          fontFamily: 'Nunito Semibold',
          color: '#333333',
          paddingTop: '20px',
          paddingBottom: '20px',
          borderTop: '1px solid #e2e2e2',
        },
      }, props.buyView.subview),

      this.formVersionSubview(),
    ])

  )
}

BuyButtonSubview.prototype.formVersionSubview = function () {
  const network = this.props.network
  if (network === '1') {
    if (this.props.buyView.formView.coinbase) {
      return h(CoinbaseForm, this.props)
    } else if (this.props.buyView.formView.shapeshift) {
      return h(ShapeshiftForm, this.props)
    }
  }
}

BuyButtonSubview.prototype.navigateTo = function (url) {
  global.platform.openWindow({ url })
}

BuyButtonSubview.prototype.backButtonContext = function () {
  if (this.props.context === 'confTx') {
    this.props.dispatch(actions.showConfTxPage(false))
  } else {
    this.props.dispatch(actions.goHome())
  }
}

BuyButtonSubview.prototype.radioHandler = function (event) {
  switch (event.target.title) {
    case 'Coinbase':
      return this.props.dispatch(actions.coinBaseSubview())
    case 'ShapeShift':
      return this.props.dispatch(actions.shapeShiftSubview(this.props.provider.type))
  }
}
