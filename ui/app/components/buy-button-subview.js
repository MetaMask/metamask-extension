const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')
const CoinbaseForm = require('./coinbase-form')
const ShapeshiftForm = require('./shapeshift-form')
const extension = require('../../../app/scripts/lib/extension')

module.exports = connect(mapStateToProps)(BuyButtonSubview)

function mapStateToProps (state) {
  return {
    selectedAccount: state.selectedAccount,
    warning: state.appState.warning,
    buyView: state.appState.buyView,
    network: state.metamask.network,
    provider: state.metamask.provider,
    context: state.appState.currentView.context,
  }
}

inherits(BuyButtonSubview, Component)
function BuyButtonSubview () {
  Component.call(this)
}

BuyButtonSubview.prototype.render = function () {
  const props = this.props
  const currentForm = props.buyView.formView

  return (
    h('.buy-eth-section', [
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
        h('h2.page-subtitle', 'Buy Eth'),
      ]),
      h('h3.flex-row.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          paddingTop: '4px',
          justifyContent: 'space-around',
        },
      }, [
        h(currentForm.coinbase ? '.activeForm' : '.inactiveForm.pointer', {
          onClick: () => props.dispatch(actions.coinBaseSubview()),
        }, 'Coinbase'),
        h('a', {
          onClick: (event) => this.navigateTo('https://github.com/MetaMask/faq/blob/master/COINBASE.md'),
        }, [
          h('i.fa.fa-question-circle', {
            style: {
              position: 'relative',
              right: '33px',
            },
          }),
        ]),
        h(currentForm.shapeshift ? '.activeForm' : '.inactiveForm.pointer', {
          onClick: () => props.dispatch(actions.shapeShiftSubview(props.provider.type)),
        }, 'Shapeshift'),

        h('a', {
          href: 'https://github.com/MetaMask/faq/blob/master/COINBASE.md',
          onClick: (event) => this.navigateTo('https://info.shapeshift.io/about'),
        }, [
          h('i.fa.fa-question-circle', {
            style: {
              position: 'relative',
              right: '28px',
            },
          }),
        ]),
      ]),
      this.formVersionSubview(),
    ])
  )
}

BuyButtonSubview.prototype.formVersionSubview = function () {
  if (this.props.network === '1') {
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
        },
      }, 'In order to access this feature please switch to the Main Network'),
      h('h3.text-transform-uppercase', 'or:'),
      this.props.network === '2' ? h('button.text-transform-uppercase', {
        onClick: () => this.props.dispatch(actions.buyEth()),
        style: {
          marginTop: '15px',
        },
      }, 'Go To Test Faucet') : null,
    ])
  }
}

BuyButtonSubview.prototype.navigateTo = function (url) {
  extension.tabs.create({ url })
}

BuyButtonSubview.prototype.backButtonContext = function () {
  if (this.props.context === 'confTx') {
    this.props.dispatch(actions.showConfTxPage(false))
  } else {
    this.props.dispatch(actions.goHome())
  }
}
