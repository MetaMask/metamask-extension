const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('../actions')

module.exports = BuyEthWarning

inherits(BuyEthWarning, Component)
function BuyEthWarning () {
  Component.call(this)
}

BuyEthWarning.prototype.render = function () {
  const props = this.props
  return (

    h('.error.flex-column', {
      key: 'ethWarning',
      style: {
        marginRight: '20px',
        marginLeft: '20px',
        alignItems: 'center',
      },
    }, [
      h('.error',
        `We  would like to remind you that MetaMask
        is in beta - only put in amounts you are comfortible losing
        `),
      h('.flex-row', [
        h('input', {
          type: 'checkbox',
          onChange: this.toggleShowWarning.bind(this,event)
        }),
        h('.warning', 'Dont show me this message again')
      ]),
      h('.flex-row', {
        style: {
          width: '100%',
          justifyContent: 'space-around'
        },
      }, [
         h('button', {
            onClick: () => this.props.dispatch(actions.backToAccountDetail(this.props.address)),
          }, 'Cancel'),

        h('button', {
          onClick: () => window.open(
              `https://buy.coinbase.com?code=&amount=5&address=${props.account}&crypto_currency=ETH`
            ),
        },
          `Continue to CoinBase`),
        ]),

      ])
  )
}

BuyEthWarning.prototype.toggleShowWarning = function (event) {
  debugger
  this.props.dispatch(actions.agreeToEthWarning())
}
