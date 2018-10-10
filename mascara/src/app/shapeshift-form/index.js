import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {qrcode} from 'qrcode-npm'
import {connect} from 'react-redux'
import {shapeShiftSubview, pairUpdate, buyWithShapeShift} from '../../../../ui/app/actions'
import {isValidAddress} from '../../../../ui/app/util'

export class ShapeShiftForm extends Component {
  static propTypes = {
    selectedAddress: PropTypes.string.isRequired,
    btnClass: PropTypes.string.isRequired,
    tokenExchangeRates: PropTypes.object.isRequired,
    coinOptions: PropTypes.object.isRequired,
    shapeShiftSubview: PropTypes.func.isRequired,
    pairUpdate: PropTypes.func.isRequired,
    buyWithShapeShift: PropTypes.func.isRequired,
  };

  state = {
    depositCoin: 'btc',
    refundAddress: '',
    showQrCode: false,
    depositAddress: '',
    errorMessage: '',
    isLoading: false,
  };

  componentWillMount () {
    this.props.shapeShiftSubview()
  }

  onCoinChange = e => {
    const coin = e.target.value
    this.setState({
      depositCoin: coin,
      errorMessage: '',
    })
    this.props.pairUpdate(coin)
  }

  onBuyWithShapeShift = () => {
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
    const pair = `${depositCoin}_eth`
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
          errorMessage: 'Invalid Request',
          isLoading: false,
        }))
    }
  }

  renderMetadata (label, value) {
    return (
      <div className="shapeshift-form__metadata-wrapper">
        <div className="shapeshift-form__metadata-label">
          {label}:
        </div>
        <div className="shapeshift-form__metadata-value">
          {value}
        </div>
      </div>
    )
  }

  renderMarketInfo () {
    const { depositCoin } = this.state
    const coinPair = `${depositCoin}_eth`
    const { tokenExchangeRates } = this.props
    const {
      limit,
      rate,
      minimum,
    } = tokenExchangeRates[coinPair] || {}

    return (
      <div className="shapeshift-form__metadata">
        {this.renderMetadata('Status', limit ? 'Available' : 'Unavailable')}
        {this.renderMetadata('Limit', limit)}
        {this.renderMetadata('Exchange Rate', rate)}
        {this.renderMetadata('Minimum', minimum)}
      </div>
    )
  }

  renderQrCode () {
    const { depositAddress, isLoading } = this.state
    const qrImage = qrcode(4, 'M')
    qrImage.addData(depositAddress)
    qrImage.make()

    return (
      <div className="shapeshift-form">
        <div className="shapeshift-form__deposit-instruction">
          Deposit your BTC to the address bellow:
        </div>
        <div className="shapeshift-form__qr-code">
          {isLoading
            ? <img src="images/loading.svg" style={{ width: '60px' }} />
            : <div dangerouslySetInnerHTML={{ __html: qrImage.createTableTag(4) }} />
          }
        </div>
        {this.renderMarketInfo()}
      </div>
    )
  }

  render () {
    const { coinOptions, btnClass } = this.props
    const { depositCoin, errorMessage, showQrCode } = this.state
    const coinPair = `${depositCoin}_eth`
    const { tokenExchangeRates } = this.props
    const token = tokenExchangeRates[coinPair]

    return showQrCode ? this.renderQrCode() : (
      <div>
        <div className="shapeshift-form">
          <div className="shapeshift-form__selectors">
            <div className="shapeshift-form__selector">
              <div className="shapeshift-form__selector-label">
                Deposit
              </div>
              <select
                className="shapeshift-form__selector-input"
                value={this.state.depositCoin}
                onChange={this.onCoinChange}
              >
                {Object.entries(coinOptions).map(([coin]) => (
                  <option key={coin} value={coin.toLowerCase()}>
                    {coin}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="icon shapeshift-form__caret"
              style={{ backgroundImage: 'url(images/caret-right.svg)'}}
            />
            <div className="shapeshift-form__selector">
              <div className="shapeshift-form__selector-label">
                Receive
              </div>
              <div className="shapeshift-form__selector-input">
                ETH
              </div>
            </div>
          </div>
          <div
            className={classnames('shapeshift-form__address-input-wrapper', {
              'shapeshift-form__address-input-wrapper--error': errorMessage,
            })}
          >
            <div className="shapeshift-form__address-input-label">
              Your Refund Address
            </div>
            <input
              type="text"
              className="shapeshift-form__address-input"
              onChange={e => this.setState({
                refundAddress: e.target.value,
                errorMessage: '',
              })}
            />
            <div className="shapeshift-form__address-input-error-message">
              {errorMessage}
            </div>
          </div>
          {this.renderMarketInfo()}
        </div>
        <button
          className={btnClass}
          disabled={!token}
          onClick={this.onBuyWithShapeShift}
        >
          Buy
        </button>
      </div>
    )
  }
}

export default connect(
  ({ metamask: { coinOptions, tokenExchangeRates, selectedAddress } }) => ({
    coinOptions, tokenExchangeRates, selectedAddress,
  }),
  dispatch => ({
    shapeShiftSubview: () => dispatch(shapeShiftSubview()),
    pairUpdate: coin => dispatch(pairUpdate(coin)),
    buyWithShapeShift: data => dispatch(buyWithShapeShift(data)),
  })
)(ShapeShiftForm)
