const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')

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

  return h('.flex-column', {
    style: {
      width: '100%',
    },
  }, [
    h('.flex-row', {
      style: {
        margin: '30px',
        marginTop: '0px',
      },
    }, [
      h('p.cursor-pointer', {
        onClick: this.toCoinbase.bind(this),
      }, [h('span', {style: {marginRight: '10px', color: '#6729a8'}}, 'Continue to Coinbase')]),
    ]),
  ])
}

CoinbaseForm.prototype.toCoinbase = function () {
  const props = this.props
  const address = props.buyView.buyAddress
  props.dispatch(actions.buyEth({ network: '1', address, amount: 0, ind: 0 }))
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
