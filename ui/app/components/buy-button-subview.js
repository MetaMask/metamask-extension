const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')

module.exports = connect(mapStateToProps)(BuyButtonSubview)

function mapStateToProps (state) {
  return {
    selectedAccount: state.selectedAccount,
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
            h('input', {
              type: 'text',
              style: {
                fontFamily: 'Montserrat Light',
                fontSize: '13px',
                width: '317px',
                height: '20px',
              },
              defaultValue: address,
              onChange: this.handleAmount.bind(this)
            }),
          ]),

          h('.flex-row', [
            h('div', 'amount:'),
            h('input', {
              style: {
                fontFamily: 'Montserrat Light',
                fontSize: '13px',
              },
              defaultValue: amount,
              onChange: this.handleAddress.bind(this)
            }),
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
          `their is a $5 dollar a day max and a $50
          dollar limit per the life time of an account with out a
          coninbase account. A fee of 3.75% will be aplied to debit/credit cards.`),

        h('.flex-row', {
          style: {
            justifyContent: 'space-around',
            margin: '33px',
          },
        }, [
          h('button', {
            onClick: () => props.dispatch(actions.buyEth(props.accountDetail.buyAddress, props.accountDetail.amount))
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

BuyButtonSubview.prototype.buyValidations = function (amount, address) {

}

