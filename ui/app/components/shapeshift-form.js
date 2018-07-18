const h = require('react-hyperscript')
const inherits = require('util').inherits
const PropTypes = require('prop-types')
const Component = require('react').Component
const connect = require('react-redux').connect
const classnames = require('classnames')
const { qrcode } = require('qrcode-npm')
const { shapeShiftSubview, pairUpdate, buyWithShapeShift } = require('../actions')
const { isValidAddress } = require('../util')
const SimpleDropdown = require('./dropdowns/simple-dropdown')

function mapStateToProps (state) {
  const {
    coinOptions,
    tokenExchangeRates,
    selectedAddress,
  } = state.metamask
  const { warning } = state.appState
  const ticker = state.metamask.settings && state.metamask.settings.ticker || 'ETH'
  const provider = state.metamask.provider

  return {
    coinOptions,
    tokenExchangeRates,
    selectedAddress,
    provider,
    ticker,
    warning,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    shapeShiftSubview: (type, ticker) => dispatch(shapeShiftSubview(type, ticker)),
    pairUpdate: (coin, ticker) => dispatch(pairUpdate(coin, ticker)),
    buyWithShapeShift: data => dispatch(buyWithShapeShift(data)),
  }
}

ShapeshiftForm.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ShapeshiftForm)


inherits(ShapeshiftForm, Component)
function ShapeshiftForm () {
  Component.call(this)

  this.state = {
    depositCoin: 'btc',
    refundAddress: '',
    showQrCode: false,
    depositAddress: '',
    errorMessage: '',
    isLoading: false,
    bought: false,
  }
}

ShapeshiftForm.prototype.getCoinPair = function () {
  const ticker = this.props.ticker
  return `${this.state.depositCoin.toUpperCase()}_${ticker}`
}

ShapeshiftForm.prototype.componentWillMount = function () {
  const ticker = this.props.ticker
  const type = this.props.provider.type
  this.props.shapeShiftSubview(type, ticker)
}

ShapeshiftForm.prototype.onCoinChange = function (coin) {
  const ticker = this.props.ticker
  this.setState({
    depositCoin: coin,
    errorMessage: '',
  })
  this.props.pairUpdate(coin, ticker)
}

ShapeshiftForm.prototype.onBuyWithShapeShift = function () {
  const ticker = this.props.ticker
  this.setState({
    isLoading: true,
    showQrCode: true,
  })

  const {
    buyWithShapeShift,
    selectedAddress: withdrawal,
  } = this.props
  const {
    refundAddress: returnAddress,
    depositCoin,
  } = this.state
  const pair = `${depositCoin}_${ticker.toLowerCase()}`
  const data = {
    withdrawal,
    pair,
    returnAddress,
    //  Public api key
    'apiKey': '803d1f5df2ed1b1476e4b9e6bcd089e34d8874595dda6a23b67d93c56ea9cc2445e98a6748b219b2b6ad654d9f075f1f1db139abfa93158c04e825db122c14b6',
  }

  if (isValidAddress(withdrawal)) {
    buyWithShapeShift(data)
      .then(d => this.setState({
        showQrCode: true,
        depositAddress: d.deposit,
        isLoading: false,
      }))
      .catch(() => this.setState({
        showQrCode: false,
        errorMessage: this.context.t('invalidRequest'),
        isLoading: false,
      }))
  }
}

ShapeshiftForm.prototype.renderMetadata = function (label, value) {
  return h('div', {className: 'shapeshift-form__metadata-wrapper'}, [

    h('div.shapeshift-form__metadata-label', {}, [
      h('span', `${label}:`),
    ]),

    h('div.shapeshift-form__metadata-value', {}, [
      h('span', value),
    ]),

  ])
}

ShapeshiftForm.prototype.renderMarketInfo = function () {
  const { tokenExchangeRates } = this.props
  const {
    limit,
    rate,
    minimum,
  } = tokenExchangeRates[this.getCoinPair()] || {}

  return h('div.shapeshift-form__metadata', {}, [

    this.renderMetadata(this.context.t('status'), limit ? this.context.t('available') : this.context.t('unavailable')),
    this.renderMetadata(this.context.t('limit'), limit),
    this.renderMetadata(this.context.t('exchangeRate'), rate),
    this.renderMetadata(this.context.t('min'), minimum),

  ])
}

ShapeshiftForm.prototype.renderQrCode = function () {
  const { depositAddress, isLoading, depositCoin } = this.state
  const qrImage = qrcode(4, 'M')
  qrImage.addData(depositAddress)
  qrImage.make()

  return h('div.shapeshift-form', {}, [

    h('div.shapeshift-form__deposit-instruction', [
      this.context.t('depositCoin', [depositCoin.toUpperCase()]),
    ]),

    h('div', depositAddress),

    h('div.shapeshift-form__qr-code', [
      isLoading
        ? h('img', {
          src: 'images/loading.svg',
          style: { width: '60px'},
        })
        : h('div', {
          dangerouslySetInnerHTML: { __html: qrImage.createTableTag(4) },
        }),
    ]),

    this.renderMarketInfo(),

  ])
}


ShapeshiftForm.prototype.render = function () {
  const { coinOptions, btnClass, warning } = this.props
  const { errorMessage, showQrCode, depositAddress } = this.state
  const { tokenExchangeRates, ticker } = this.props
  const token = tokenExchangeRates[this.getCoinPair()]

  return h('div.shapeshift-form-wrapper', [
    showQrCode
      ? this.renderQrCode()
      : h('div.modal-shapeshift-form', [
          h('div.shapeshift-form__selectors', [

            h('div.shapeshift-form__selector', [

              h('div.shapeshift-form__selector-label', this.context.t('deposit')),

              h(SimpleDropdown, {
                selectedOption: this.state.depositCoin,
                onSelect: (coin) => this.onCoinChange(coin),
                options: Object.entries(coinOptions).map(([coin]) => ({
                  value: coin.toLowerCase(),
                  displayValue: coin,
                })),
              }),

            ]),

            h('div.icon.shapeshift-form__caret', {
              style: { backgroundImage: 'url(images/caret-right.svg)'},
            }),

            h('div.shapeshift-form__selector', [

              h('div.shapeshift-form__selector-label', [
                this.context.t('receive'),
              ]),

              h('div.shapeshift-form__selector-input', [ticker]),

            ]),

          ]),

          warning && h('div.shapeshift-form__address-input-label', warning),

          !warning && h('div', {
            className: classnames('shapeshift-form__address-input-wrapper', {
              'shapeshift-form__address-input-wrapper--error': errorMessage,
            }),
          }, [

            h('div.shapeshift-form__address-input-label', [
              this.context.t('refundAddress'),
            ]),

            h('input.shapeshift-form__address-input', {
              type: 'text',
              onChange: e => this.setState({
                refundAddress: e.target.value,
                errorMessage: '',
              }),
            }),

            h('divshapeshift-form__address-input-error-message', [errorMessage]),
          ]),

          !warning && this.renderMarketInfo(),

      ]),

      !depositAddress && h('button.btn-primary.btn--large.shapeshift-form__shapeshift-buy-btn', {
        className: btnClass,
        disabled: !token,
        onClick: () => this.onBuyWithShapeShift(),
      }, [this.context.t('buy')]),

    ])
}
