const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const GasModalCard = require('../send/gas-modal-card')

function mapStateToProps (state) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
  }
}

inherits(CustomizeGasModal, Component)
function CustomizeGasModal () {
  Component.call(this)

  this.state = {
    gasPrice: '0.23',
    gasLimit: '25000',
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(CustomizeGasModal)

CustomizeGasModal.prototype.render = function () {
  const { hideModal } = this.props
  const { gasPrice, gasLimit } = this.state

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
          value: gasPrice,
          min: 0.0,
          max: 5.0,
          step: 0.01,
          onChange: value => this.setState({ gasPrice: value }),
          title: 'Gas Price',
          copy: 'We calculate the suggested gas prices based on network success rates.',
        }),

        h(GasModalCard, {
          value: gasLimit,
          min: 20000,
          max: 100000,
          step: 1,
          onChange: value => this.setState({ gasLimit: value }),
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
            onClick: () => console.log('Save'),
          }, ['SAVE']),
        ])

      ]),

    ]),
  ])
}
