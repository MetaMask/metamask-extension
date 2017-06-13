const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')
const CoinbaseForm = require('./coinbase-form')
const ShapeshiftForm = require('./shapeshift-form')
const Loading = require('./loading')
const AccountPanel = require('./account-panel')
const RadioList = require('./custom-radio-list')

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
  const props = this.props
  const isLoading = props.isSubLoading

  return (
    h('.buy-eth-section.flex-column', {
      style: {
        alignItems: 'center',
      },
    }, [
             // back button
      h('.flex-row', {
        style: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }, [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer.color-orange', {
          onClick: this.backButtonContext.bind(this),
          style: {
            position: 'absolute',
            left: '10px',
          },
        }),
        h('h2.text-transform-uppercase.flex-center', {
          style: {
            width: '100vw',
            background: 'rgb(235, 235, 235)',
            color: 'rgb(174, 174, 174)',
            paddingTop: '4px',
            paddingBottom: '4px',
          },
        }, 'Buy Eth'),
      ]),
      h('div', {
        style: {
          position: 'absolute',
          top: '57vh',
          left: '49vw',
        },
      }, [
        h(Loading, {isLoading}),
      ]),
      h('div', {
        style: {
          width: '80%',
        },
      }, [
        h(AccountPanel, {
          showFullAddress: true,
          identity: props.identity,
          account: props.account,
        }),
      ]),
      h('h3.text-transform-uppercase', {
        style: {
          paddingLeft: '15px',
          fontFamily: 'Montserrat Light',
          width: '100vw',
          background: 'rgb(235, 235, 235)',
          color: 'rgb(174, 174, 174)',
          paddingTop: '4px',
          paddingBottom: '4px',
        },
      }, 'Select Service'),
      h('.flex-row.selected-exchange', {
        style: {
          position: 'relative',
          right: '35px',
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
      h('h3.text-transform-uppercase', {
        style: {
          paddingLeft: '15px',
          fontFamily: 'Montserrat Light',
          width: '100vw',
          background: 'rgb(235, 235, 235)',
          color: 'rgb(174, 174, 174)',
          paddingTop: '4px',
          paddingBottom: '4px',
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
  } else {
    return h('div.flex-column', {
      style: {
        alignItems: 'center',
        margin: '50px',
      },
    }, [
      h('h3.text-transform-uppercase', {
        style: {
          width: '225px',
          marginBottom: '15px',
        },
      }, 'In order to access this feature, please switch to the Main Network'),
      ((network === '3') || (network === '4') || (network === '42')) ? h('h3.text-transform-uppercase', 'or go to the') : null,
      (network === '3') ? h('button.text-transform-uppercase', {
        onClick: () => this.props.dispatch(actions.buyEth({ network })),
        style: {
          marginTop: '15px',
        },
      }, 'Ropsten Test Faucet') : null,
      (network === '4') ? h('button.text-transform-uppercase', {
        onClick: () => this.props.dispatch(actions.buyEth({ network })),
        style: {
          marginTop: '15px',
        },
      }, 'Rinkeby Test Faucet') : null,
      (network === '42') ? h('button.text-transform-uppercase', {
        onClick: () => this.props.dispatch(actions.buyEth({ network })),
        style: {
          marginTop: '15px',
        },
      }, 'Kovan Test Faucet') : null,
    ])
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
