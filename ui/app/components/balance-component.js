const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
import TokenBalance from './token-balance'
import Identicon from './identicon'
import UserPreferencedCurrencyDisplay from './user-preferenced-currency-display'
import { PRIMARY, SECONDARY } from '../constants/common'
const { getNativeCurrency, getAssetImages, conversionRateSelector, getCurrentCurrency, getMetaMaskAccounts } = require('../selectors')

const { formatBalance } = require('../util')

module.exports = connect(mapStateToProps)(BalanceComponent)

function mapStateToProps (state) {
  const accounts = getMetaMaskAccounts(state)
  const network = state.metamask.network
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  const account = accounts[selectedAddress]

  return {
    account,
    network,
    nativeCurrency: getNativeCurrency(state),
    conversionRate: conversionRateSelector(state),
    currentCurrency: getCurrentCurrency(state),
    assetImages: getAssetImages(state),
  }
}

inherits(BalanceComponent, Component)
function BalanceComponent () {
  Component.call(this)
}

BalanceComponent.prototype.render = function () {
  const props = this.props
  const { token, network, assetImages } = props
  const address = token && token.address
  const image = assetImages && address ? assetImages[token.address] : undefined

  return h('div.balance-container', {}, [

    // TODO: balance icon needs to be passed in
    // h('img.balance-icon', {
    //   src: '../images/eth_logo.svg',
    //   style: {},
    // }),
    h(Identicon, {
      diameter: 50,
      address,
      network,
      image,
    }),

    token ? this.renderTokenBalance() : this.renderBalance(),
  ])
}

BalanceComponent.prototype.renderTokenBalance = function () {
  const { token } = this.props

  return h('div.flex-column.balance-display', [
    h('div.token-amount', [ h(TokenBalance, { token }) ]),
  ])
}

BalanceComponent.prototype.renderBalance = function () {
  const props = this.props
  const { account, nativeCurrency } = props
  const balanceValue = account && account.balance
  const needsParse = 'needsParse' in props ? props.needsParse : true
  const formattedBalance = balanceValue ? formatBalance(balanceValue, 6, needsParse, nativeCurrency) : '...'
  const showFiat = 'showFiat' in props ? props.showFiat : true

  if (formattedBalance === 'None' || formattedBalance === '...') {
    return h('div.flex-column.balance-display', {}, [
      h('div.token-amount', {
        style: {},
      }, formattedBalance),
    ])
  }

  return h('div.flex-column.balance-display', {}, [
    h(UserPreferencedCurrencyDisplay, {
      className: 'token-amount',
      value: balanceValue,
      type: PRIMARY,
      ethNumberOfDecimals: 4,
    }),

    showFiat && h(UserPreferencedCurrencyDisplay, {
      value: balanceValue,
      type: SECONDARY,
      ethNumberOfDecimals: 4,
    }),
  ])
}

BalanceComponent.prototype.getFiatDisplayNumber = function (formattedBalance, conversionRate) {
  if (formattedBalance === 'None') return formattedBalance
  if (conversionRate === 0) return 'N/A'

  const splitBalance = formattedBalance.split(' ')

  const convertedNumber = (Number(splitBalance[0]) * conversionRate)
  const wholePart = Math.floor(convertedNumber)
  const decimalPart = convertedNumber - wholePart

  return wholePart + Number(decimalPart.toPrecision(2))
}
