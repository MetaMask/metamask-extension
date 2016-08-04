const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')
const CoinbaseForm = require('./coinbase-form')
const ShapeshiftForm = require('./shapeshift-form')

module.exports = connect(mapStateToProps)(BuyButtonSubview)

function mapStateToProps (state) {
  return {
    selectedAccount: state.selectedAccount,
    warning: state.appState.warning,
    network: state.metamask.network,
    provider: state.metamask.provider,
  }
}

inherits(BuyButtonSubview, Component)
function BuyButtonSubview () {
  Component.call(this)
}

BuyButtonSubview.prototype.render = function () {
  const props = this.props
  const currentForm = props.accountDetail.formView

  return (
    h('span', {key: 'buyForm'}, [
      h('h3.flex-row.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          paddingTop: '4px',
          justifyContent: 'space-around',
        },
      }, [
        h(currentForm.coinbase ? '.activeForm' : '.inactiveForm', {
          onClick: () => props.dispatch(actions.coinBaseSubview()),
        }, 'Coinbase'),
        h(currentForm.shapeshift ? '.activeForm' : '.inactiveForm', {
          onClick: () => props.dispatch(actions.shapeShiftSubview(props.provider.type)),
        }, 'Shapeshift'),
      ]),
      this.formVersionSubview(),
    ])
  )
}

BuyButtonSubview.prototype.formVersionSubview = function () {
  if (this.props.network === '1') {
    if (this.props.accountDetail.formView.coinbase) {
      return h(CoinbaseForm, this.props)
    } else if (this.props.accountDetail.formView.shapeshift) {
      return h(ShapeshiftForm, this.props)
    }
  } else {
    console.log(this.props.network)
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
      }, 'In order to access this feature please switch too the Main Ethereum Network'),
    ])
  }
}

