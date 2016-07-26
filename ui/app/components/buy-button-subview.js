const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')

const isValidAddress = require('../util').isValidAddress
module.exports = connect(mapStateToProps)(BuyButtonSubview)

function mapStateToProps (state) {
  return {
    selectedAccount: state.selectedAccount,
    warning: state.appState.warning,
  }
}

inherits(BuyButtonSubview, Component)
function BuyButtonSubview () {
  Component.call(this)
}

BuyButtonSubview.prototype.render = function () {
  const props = this.props
  var amount = props.accountDetail.amount
  var address = props.accountDetail.buyAddress

  return (
    h('span', {key: 'buyForm'}, [
      h('h3.flex-row.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          paddingTop: '4px',
          justifyContent: 'space-around'
        },
      }, [
        h('div', {
          style: {
            background: '#F7F7F7',
            border: 'none',
            borderRadius: '8px 8px 0px 0px',
            width: '50%',
            textAlign: 'center',
            paddingBottom: '4px',
          },
        }, 'Coinbase'),
        h('div', {
          style: {
            border: 'none',
            borderRadius: '8px 8px 0px 0px',
            width: '50%',
            textAlign: 'center',
            paddingBottom: '4px',
          },
        }, 'Shapeshift'),
      ]),
      h('.flex-column', {
        key: 'buyForm',
        style: {
          margin: '10px',
        },
      }, [
        h('.flex-column', {
          style: {
            alignItems: 'flex-start',
          }
        },[
          h('.flex-column', [
            h('div', 'Address:'),
            h('.input-container', {
              style: {
              },
            }, [
              h('input.buy-inputs', {
                type: 'text',
                style: {
                  boxSizing: 'border-box',
                  width: '317px',
                  height: '20px',
                  padding: ' 12px 0px 12px 1px ',
                },
                defaultValue: address,
                onChange: this.handleAddress.bind(this),
              }),
              h('i.fa.fa-pencil-square-o.edit-text', {
                style: {
                  fontSize: '12px',
                  color: '#F7861C',
                  position: 'relative',
                  bottom: '8px',
                  right: '11px',
                }
              }),

            ]),
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
                }
              }),
            ]),
          ]),
        ]),

        h('.info-gray', {
          style: {
            fontSize: '10px',
            fontFamily: 'Montserrat Light',
            margin: '15px',
            lineHeight: '13px'
          }
        },
          `there is a USD$ 5 a day max and a USD$ 50
          dollar limit per the life time of an account without a
          coinbase account. A fee of 3.75% will be aplied to debit/credit cards.`),

        !props.warning ? h('div', {
          style: {
            width: '340px',
            height: '22px',
          },
        }) :props.warning && h('span.error.flex-center', props.warning),


        h('.flex-row', {
          style: {
            justifyContent: 'space-around',
            margin: '33px',
          },
        }, [
          h('button', {
            onClick: this.toCoinbase.bind(this)
          }, 'Continue to Coinbase'),

          h('button', {
            onClick: () => props.dispatch(actions.backToAccountDetail(props.accounts.address))
          }, 'Cancel'),
        ]),
      ]),
    ])
  )
}

BuyButtonSubview.prototype.handleAmount = function (event) {
  this.props.dispatch(actions.updateCoinBaseAmount(event.target.value))
}
BuyButtonSubview.prototype.handleAddress = function (event) {
  this.props.dispatch(actions.updateCoinBaseAddress(event.target.value))
}

BuyButtonSubview.prototype.toCoinbase = function () {
  var props = this.props
  var amount = props.accountDetail.amount
  var address = props.accountDetail.buyAddress
  var message
  debugger
  if(isValidAddress(props.accountDetail.buyAddress) && isValidAmountforCoinBase(amount).valid){
    props.dispatch(actions.buyEth(props.accountDetail.buyAddress, props.accountDetail.amount))
  } else if (!isValidAmountforCoinBase(amount).valid) {
    debugger
    message = isValidAmountforCoinBase(amount).message
    return props.dispatch(actions.showWarning(message))
  } else {
    debugger
    message = 'Receiving address is invalid.'
    return props.dispatch(actions.showWarning(message))
  }
}

function isValidAmountforCoinBase (amount) {
  amount = parseFloat(amount)
  debugger
  if (amount) {
    if (amount <= 5 && amount > 0){
      return {valid: true}
    } else if (amount > 5) {
      return {valid: false, message: 'The amount can not be greater then $5'}
    } else {
      return {valid: false, message: 'Can not buy amounts less then $0'}
    }
  } else {
    return {valid: false, message: 'The amount entered is not a number'}
  }
}

