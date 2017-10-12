const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const GasModalCard = require('./gas-modal-card')

const { conversionUtil } = require('../../conversion-util')

const {
  getGasPrice,
  getGasLimit,
  conversionRateSelector,
} = require('../../selectors')

function mapStateToProps (state) {
  return {
    gasPrice: getGasPrice(state),
    gasLimit: getGasLimit(state),
    conversionRate: conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    updateGasPrice: newGasPrice => dispatch(actions.updateGasPrice(newGasPrice)),
    updateGasLimit: newGasLimit => dispatch(actions.updateGasLimit(newGasLimit)),
  }
}

inherits(CustomizeGasModal, Component)
function CustomizeGasModal (props) {
  Component.call(this)

  this.state = {
    gasPrice: props.gasPrice,
    gasLimit: props.gasLimit,
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(CustomizeGasModal)

CustomizeGasModal.prototype.save = function (gasPrice, gasLimit) {
  const {
    updateGasPrice,
    updateGasLimit,
    hideModal,
  } = this.props

  updateGasPrice(gasPrice)
  updateGasLimit(gasLimit)
  hideModal()
}

CustomizeGasModal.prototype.convertAndSetGasLimit = function (newGasLimit) {
  const convertedGasLimit = conversionUtil(newGasLimit, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  })

  this.setState({ gasLimit: convertedGasLimit })
}

CustomizeGasModal.prototype.convertAndSetGasPrice = function (newGasPrice) {
  const convertedGasPrice = conversionUtil(newGasPrice, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  })

  this.setState({ gasPrice: convertedGasPrice })
}

CustomizeGasModal.prototype.render = function () {
  const { hideModal, conversionRate } = this.props
  const { gasPrice, gasLimit } = this.state

  const convertedGasPrice = conversionUtil(gasPrice, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  })

  const convertedGasLimit = conversionUtil(gasLimit, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  })

  return h('div.send-v2__customize-gas', {}, [
    h('div', {
    }, [
      h('div.send-v2__customize-gas__header', {}, [

        h('div.send-v2__customize-gas__title', 'Customize Gas'),

        h('div.send-v2__customize-gas__close', {
          onClick: hideModal,
        }),

      ]),

      h('div.send-v2__customize-gas__body', {}, [
        
        h(GasModalCard, {
          value: convertedGasPrice,
          min: 0,
          max: 1000,
          step: 1,
          onChange: value => this.convertAndSetGasPrice(value),
          title: 'Gas Price',
          copy: 'We calculate the suggested gas prices based on network success rates.',
        }),

        h(GasModalCard, {
          value: convertedGasLimit,
          min: 20000,
          max: 100000,
          step: 1,
          onChange: value => this.convertAndSetGasLimit(value),
          title: 'Gas Limit',
          copy: 'We calculate the suggested gas limit based on network success rates.',
        }),

      ]),

      h('div.send-v2__customize-gas__footer', {}, [
        
        h('div.send-v2__customize-gas__revert', {
          onClick: () => console.log('Revert'),
        }, ['Revert']),

        h('div.send-v2__customize-gas__buttons', [
          h('div.send-v2__customize-gas__cancel', {
            onClick: this.props.hideModal,
          }, ['CANCEL']),

          h('div.send-v2__customize-gas__save', {
            onClick: () => this.save(gasPrice, gasLimit),
          }, ['SAVE']),
        ])

      ]),

    ]),
  ])
}
