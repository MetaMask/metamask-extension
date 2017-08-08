const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const { formatBalance, generateBalanceObject } = require('../util')

module.exports = BalanceComponent

inherits(BalanceComponent, Component)
function BalanceComponent () {
  Component.call(this)
}

BalanceComponent.prototype.render = function () {
  const props = this.props
  const { balanceValue } = props
  const needsParse = 'needsParse' in props ? props.needsParse : true
  const formattedBalance = balanceValue ? formatBalance(balanceValue, 6, needsParse) : '...'

  return h('div.balance-container', {}, [
    // laptop: 50px 50px
    // mobile: 100px 100px

    // TODO: balance icon needs to be passed in
    h('img.balance-icon', {
      src: '../images/eth_logo.svg',
      style: {},
    }),

    this.renderBalance(formattedBalance),
  ])
}

BalanceComponent.prototype.renderBalance = function (formattedBalance) {
  const props = this.props
  const { shorten } = props
  const showFiat = 'showFiat' in props ? props.showFiat : true

  if (formattedBalance === 'None' || formattedBalance === '...') {
    return h('div.flex-column.balance-display', {}, [
      h('div.token-amount', {
        style: {},
      }, formattedBalance),
    ])
  }

  var balanceObj = generateBalanceObject(formattedBalance, shorten ? 1 : 3)
  var balanceValue = shorten ? balanceObj.shortBalance : balanceObj.balance

  var label = balanceObj.label

  // laptop: 5vw?
  // phone: 50vw?
  return h('div.flex-column.balance-display', {}, [
    h('div.token-amount', {
      style: {},
    }, `${balanceValue} ${label}`),

    showFiat ? this.renderFiatValue(formattedBalance) : null,
  ])
}

BalanceComponent.prototype.renderFiatValue = function (formattedBalance) {

  const props = this.props
  const { conversionRate, currentCurrency } = props

  if (formattedBalance === 'None') return formattedBalance
  var fiatDisplayNumber
  var splitBalance = formattedBalance.split(' ')

  if (conversionRate !== 0) {
    fiatDisplayNumber = (Number(splitBalance[0]) * conversionRate).toFixed(2)
  } else {
    fiatDisplayNumber = 'N/A'
  }

  return fiatDisplay(fiatDisplayNumber, currentCurrency)
}

function fiatDisplay (fiatDisplayNumber, fiatSuffix) {
  if (fiatDisplayNumber !== 'N/A') {
    return h('div.fiat-amount', {
      style: {},
    }, `${fiatDisplayNumber} ${fiatSuffix}`)
  } else {
    return h('div')
  }
}
