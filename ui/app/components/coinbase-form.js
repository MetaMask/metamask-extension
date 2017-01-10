const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')

const isValidAddress = require('../util').isValidAddress
module.exports = connect(mapStateToProps)(CoinbaseForm)

function mapStateToProps(state) {
  return {
    selectedAccount: state.selectedAccount,
    warning: state.appState.warning,
  }
}

inherits(CoinbaseForm, Component)

function CoinbaseForm() {
  Component.call(this)
}

CoinbaseForm.prototype.render = function () {
  var props = this.props
  var amount = props.buyView.amount
  var address = props.buyView.buyAddress

  return h('.flex-column', {
    style: {
      // margin: '10px',
      padding: '25px',
    },
  }, [
    h('.flex-column', {
      style: {
        alignItems: 'flex-start',
      },
    }, [
      h('.flex-row', [
        h('div', 'Address:'),
        h('.ellip-address', address),
      ]),
      h('.flex-row', [
        h('div', 'Amount: $'),
        h('.input-container', [
          h('input.buy-inputs', {
            style: {
              width: '3em',
              boxSizing: 'border-box',
            },
            defaultValue: amount,
            onChange: this.handleAmount.bind(this),
          }),
          h('i.fa.fa-pencil-square-o.edit-text', {
            style: {
              fontSize: '12px',
              color: '#F7861C',
              position: 'relative',
              bottom: '5px',
              right: '11px',
            },
          }),
        ]),
      ]),
    ]),

    h('.info-gray', {
      style: {
        fontSize: '10px',
        fontFamily: 'Montserrat Light',
        margin: '15px',
        lineHeight: '13px',
      },
    },
      `there is a USD$ 15 a day max and a USD$ 50
          dollar limit per the life time of an account without a
          coinbase account. A fee of 3.75% will be aplied to debit/credit cards.`),

    !props.warning ? h('div', {
      style: {
        width: '340px',
        height: '22px',
      },
    }) : props.warning && h('span.error.flex-center', props.warning),


    h('.flex-row', {
      style: {
        justifyContent: 'space-around',
        margin: '33px',
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
CoinbaseForm.prototype.handleAmount = function (event) {
  this.props.dispatch(actions.updateCoinBaseAmount(event.target.value))
}
CoinbaseForm.prototype.handleAddress = function (event) {
  this.props.dispatch(actions.updateBuyAddress(event.target.value))
}
CoinbaseForm.prototype.toCoinbase = function () {
  var props = this.props
  var amount = props.buyView.amount
  var address = props.buyView.buyAddress
  var message

  if (isValidAddress(address) && isValidAmountforCoinBase(amount).valid) {
    props.dispatch(actions.buyEth(address, props.buyView.amount))
  } else if (!isValidAmountforCoinBase(amount).valid) {
    message = isValidAmountforCoinBase(amount).message
    return props.dispatch(actions.displayWarning(message))
  } else {
    message = 'Receiving address is invalid.'
    return props.dispatch(actions.displayWarning(message))
  }
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

function isValidAmountforCoinBase(amount) {
  amount = parseFloat(amount)

  if (amount) {
    if (amount <= 15 && amount > 0) {
      return {
        valid: true,
      }
    } else if (amount > 15) {
      return {
        valid: false,
        message: 'The amount can not be greater then $15',
      }
    } else {
      return {
        valid: false,
        message: 'Can not buy amounts less then $0',
      }
    }
  } else {
    return {
      valid: false,
      message: 'The amount entered is not a number',
    }
  }
}
