const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')

module.exports = connect(mapStateToProps)(CoinbaseForm)

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
  }
}

inherits(CoinbaseForm, Component)

function CoinbaseForm () {
  Component.call(this)
}

CoinbaseForm.prototype.render = function () {
  var props = this.props

  return h('.flex-column', {
    style: {
      // margin: '10px',
      padding: '25px',
      width: '100%',
    },
  }, [
    h('.flex-row', {
      style: {
        justifyContent: 'space-around',
        margin: '33px',
        marginTop: '0px',
      },
    }, [
      h('button', {
        onClick: this.toCoinbase.bind(this),
      }, 'Continue to Coinbase'),

      h('button', {
        onClick: () => props.dispatch(actions.backTobuyView(props.accounts.address)),
      }, 'Cancel'),
    ]),
  ])
}

CoinbaseForm.prototype.toCoinbase = function () {
  const props = this.props
  const address = props.buyView.buyAddress
  props.dispatch(actions.buyEth({ network: '1', address, amount: 0 }))
}

CoinbaseForm.prototype.renderLoading = function () {
  return h('img', {
    style: {
      width: '27px',
      marginRight: '-27px',
    },
    src: 'images/loading.svg',
  })
}
