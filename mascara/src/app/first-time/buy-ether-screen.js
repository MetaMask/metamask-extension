import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {connect} from 'react-redux'
import {qrcode} from 'qrcode-npm'
import copyToClipboard from 'copy-to-clipboard'
import ShapeShiftForm from '../shapeshift-form'
import Identicon from '../../../../ui/app/components/identicon'
import {buyEth, showAccountDetail} from '../../../../ui/app/actions'

class BuyEtherScreen extends Component {
  static OPTION_VALUES = {
    COINBASE: 'coinbase',
    SHAPESHIFT: 'shapeshift',
    QR_CODE: 'qr_code',
  };

  static OPTIONS = [
    {
      name: 'Direct Deposit',
      value: BuyEtherScreen.OPTION_VALUES.QR_CODE,
    },
    {
      name: 'Buy with Dollars',
      value: BuyEtherScreen.OPTION_VALUES.COINBASE,
    },
    {
      name: 'Buy with Cryptos',
      value: BuyEtherScreen.OPTION_VALUES.SHAPESHIFT,
    },
  ];

  static propTypes = {
    address: PropTypes.string,
    goToCoinbase: PropTypes.func.isRequired,
    showAccountDetail: PropTypes.func.isRequired,
  }

  state = {
    selectedOption: BuyEtherScreen.OPTION_VALUES.QR_CODE,
    justCopied: false,
  }

  copyToClipboard = () => {
    const { address } = this.props

    this.setState({ justCopied: true }, () => copyToClipboard(address))

    setTimeout(() => this.setState({ justCopied: false }), 1000)
  }

  renderSkip () {
    const {showAccountDetail, address} = this.props

    return (
      <div
        className="buy-ether__do-it-later"
        onClick={() => showAccountDetail(address)}
      >
        Do it later
      </div>
    )
  }

  renderCoinbaseLogo () {
    return (
      <svg width="140px" height="49px" viewBox="0 0 579 126" version="1.1">
        <g id="Page-1" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
          <g id="Imported-Layers" fill="#0081C9">
            <path d="M37.752,125.873 C18.824,125.873 0.369,112.307 0.369,81.549 C0.369,50.79 18.824,37.382 37.752,37.382 C47.059,37.382 54.315,39.749 59.52,43.219 L53.841,55.68 C50.371,53.156 45.166,51.579 39.961,51.579 C28.604,51.579 18.193,60.57 18.193,81.391 C18.193,102.212 28.919,111.361 39.961,111.361 C45.166,111.361 50.371,109.783 53.841,107.26 L59.52,120.036 C54.157,123.664 47.059,125.873 37.752,125.873" id="Fill-1" />
            <path d="M102.898,125.873 C78.765,125.873 65.515,106.786 65.515,81.549 C65.515,56.311 78.765,37.382 102.898,37.382 C127.032,37.382 140.282,56.311 140.282,81.549 C140.282,106.786 127.032,125.873 102.898,125.873 L102.898,125.873 Z M102.898,51.105 C89.491,51.105 82.866,63.093 82.866,81.391 C82.866,99.688 89.491,111.834 102.898,111.834 C116.306,111.834 122.931,99.688 122.931,81.391 C122.931,63.093 116.306,51.105 102.898,51.105 L102.898,51.105 Z" id="Fill-2" />
            <path d="M163.468,23.659 C157.79,23.659 153.215,19.243 153.215,13.88 C153.215,8.517 157.79,4.1 163.468,4.1 C169.146,4.1 173.721,8.517 173.721,13.88 C173.721,19.243 169.146,23.659 163.468,23.659 L163.468,23.659 Z M154.793,39.118 L172.144,39.118 L172.144,124.138 L154.793,124.138 L154.793,39.118 Z" id="Fill-3" />
            <path d="M240.443,124.137 L240.443,67.352 C240.443,57.415 234.449,51.263 222.619,51.263 C216.31,51.263 210.473,52.367 207.003,53.787 L207.003,124.137 L189.81,124.137 L189.81,43.376 C198.328,39.906 209.212,37.382 222.461,37.382 C246.28,37.382 257.794,47.793 257.794,65.775 L257.794,124.137 L240.443,124.137" id="Fill-4" />
            <path d="M303.536,125.873 C292.494,125.873 281.611,123.191 274.986,119.879 L274.986,0.314 L292.179,0.314 L292.179,41.326 C296.28,39.433 302.905,37.856 308.741,37.856 C330.667,37.856 345.494,53.629 345.494,79.656 C345.494,111.676 328.931,125.873 303.536,125.873 L303.536,125.873 Z M305.744,51.263 C301.012,51.263 295.491,52.367 292.179,54.103 L292.179,109.941 C294.703,111.045 299.593,112.149 304.482,112.149 C318.205,112.149 328.301,102.685 328.301,80.918 C328.301,62.305 319.467,51.263 305.744,51.263 L305.744,51.263 Z" id="Fill-5" />
            <path d="M392.341,125.873 C367.892,125.873 355.589,115.935 355.589,99.215 C355.589,75.555 380.826,71.296 406.537,69.876 L406.537,64.513 C406.537,53.787 399.439,50.001 388.555,50.001 C380.511,50.001 370.731,52.525 365.053,55.207 L360.636,43.376 C367.419,40.379 378.933,37.382 390.29,37.382 C410.638,37.382 422.942,45.269 422.942,66.248 L422.942,119.879 C416.79,123.191 404.329,125.873 392.341,125.873 L392.341,125.873 Z M406.537,81.391 C389.186,82.337 371.835,83.757 371.835,98.9 C371.835,107.89 378.776,113.411 391.868,113.411 C397.389,113.411 403.856,112.465 406.537,111.203 L406.537,81.391 L406.537,81.391 Z" id="Fill-6" />
            <path d="M461.743,125.873 C451.806,125.873 441.395,123.191 435.244,119.879 L441.08,106.629 C445.496,109.31 454.803,112.149 461.27,112.149 C470.576,112.149 476.728,107.575 476.728,100.477 C476.728,92.748 470.261,89.751 461.586,86.596 C450.228,82.337 437.452,77.132 437.452,61.201 C437.452,47.162 448.336,37.382 467.264,37.382 C477.517,37.382 486.035,39.906 492.029,43.376 L486.665,55.364 C482.88,52.998 475.309,50.317 469.157,50.317 C460.166,50.317 455.118,55.049 455.118,61.201 C455.118,68.93 461.428,71.611 469.788,74.766 C481.618,79.183 494.71,84.072 494.71,100.635 C494.71,115.935 483.038,125.873 461.743,125.873" id="Fill-7" />
            <path d="M578.625,81.233 L522.155,89.12 C523.89,104.42 533.828,112.149 548.182,112.149 C556.699,112.149 565.848,110.099 571.684,106.944 L576.732,119.879 C570.107,123.349 558.75,125.873 547.078,125.873 C520.262,125.873 505.277,108.679 505.277,81.549 C505.277,55.522 519.789,37.382 543.607,37.382 C565.69,37.382 578.782,51.894 578.782,74.766 C578.782,76.816 578.782,79.025 578.625,81.233 L578.625,81.233 Z M543.292,50.001 C530.042,50.001 521.367,60.097 521.051,77.763 L562.22,72.084 C562.062,57.257 554.649,50.001 543.292,50.001 L543.292,50.001 Z" id="Fill-8" />
          </g>
        </g>
      </svg>
    )
  }

  renderCoinbaseForm () {
    const {goToCoinbase, address} = this.props

    return (
      <div className="buy-ether__action-content-wrapper">
        <div>{this.renderCoinbaseLogo()}</div>
        <div className="buy-ether__body-text">Coinbase is the world’s most popular way to buy and sell bitcoin, ethereum, and litecoin.</div>
        <a className="first-time-flow__link buy-ether__faq-link">What is Ethereum?</a>
        <div className="buy-ether__buttons">
          <button
            className="first-time-flow__button"
            onClick={() => goToCoinbase(address)}
          >
            Buy
          </button>
        </div>
      </div>
    )
  }

  renderContent () {
    const { OPTION_VALUES } = BuyEtherScreen
    const { address } = this.props
    const { justCopied } = this.state
    const qrImage = qrcode(4, 'M')
    qrImage.addData(address)
    qrImage.make()

    switch (this.state.selectedOption) {
      case OPTION_VALUES.COINBASE:
        return this.renderCoinbaseForm()
      case OPTION_VALUES.SHAPESHIFT:
        return (
          <div className="buy-ether__action-content-wrapper">
            <div className="shapeshift-logo" />
            <div className="buy-ether__body-text">
              Trade any leading blockchain asset for any other. Protection by Design. No Account Needed.
            </div>
            <ShapeShiftForm btnClass="first-time-flow__button" />
          </div>
          )
      case OPTION_VALUES.QR_CODE:
        return (
          <div className="buy-ether__action-content-wrapper">
            <div dangerouslySetInnerHTML={{ __html: qrImage.createTableTag(4) }} />
            <div className="buy-ether__body-text">Deposit Ether directly into your account.</div>
            <div className="buy-ether__small-body-text">(This is the account address that MetaMask created for you to recieve funds.)</div>
            <div className="buy-ether__buttons">
              <button
                className="first-time-flow__button"
                onClick={this.copyToClipboard}
                disabled={justCopied}
              >
                { justCopied ? 'Copied' : 'Copy' }
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  render () {
    const { OPTIONS } = BuyEtherScreen
    const { selectedOption } = this.state

    return (
      <div className="buy-ether">
        <Identicon address={this.props.address} diameter={70} />
        <div className="buy-ether__title">Deposit Ether</div>
        <div className="buy-ether__body-text">
          MetaMask works best if you have Ether in your account to pay for transaction gas fees and more. To get Ether, choose from one of these methods.
        </div>
        <div className="buy-ether__content-wrapper">
          <div className="buy-ether__content-headline-wrapper">
            <div className="buy-ether__content-headline">Deposit Options</div>
            {this.renderSkip()}
          </div>
          <div className="buy-ether__content">
            <div className="buy-ether__side-panel">
              {OPTIONS.map(({ name, value }) => (
                <div
                  key={value}
                  className={classnames('buy-ether__side-panel-item', {
                    'buy-ether__side-panel-item--selected': value === selectedOption,
                  })}
                  onClick={() => this.setState({ selectedOption: value })}
                >
                  <div className="buy-ether__side-panel-item-name">{name}</div>
                  {value === selectedOption && (
                    <svg viewBox="0 0 574 1024" id="si-ant-right" width="15px" height="15px">
                      <path d="M10 9Q0 19 0 32t10 23l482 457L10 969Q0 979 0 992t10 23q10 9 24 9t24-9l506-480q10-10 10-23t-10-23L58 9Q48 0 34 0T10 9z" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <div className="buy-ether__action-content">
              {this.renderContent()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(
  ({ metamask: { selectedAddress } }) => ({
    address: selectedAddress,
  }),
  dispatch => ({
    goToCoinbase: address => dispatch(buyEth({ network: '1', address, amount: 0 })),
    showAccountDetail: address => dispatch(showAccountDetail(address)),
  })
)(BuyEtherScreen)
