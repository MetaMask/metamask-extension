import PropTypes from 'prop-types'
import React from 'react'
import qrCode from 'qrcode-generator'
import { connect } from 'react-redux'
import ReadOnlyInput from './readonly-input'
import NetworkTag from './network-tag'

class QrCodeView extends React.Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  render() {
    const {
      message,
      data,
      testnetBase32Address,
      mainnetBase32Address,
    } = this.props.Qr
    const address = `conflux:${data}`
    const qrImage = qrCode(4, 'M')
    qrImage.addData(address)
    qrImage.make()
    const [isMainnet, isTestnet] = [
      data === mainnetBase32Address,
      data === testnetBase32Address,
    ]

    const currentTagName =
      (isMainnet && 'mainnet') || (isTestnet && 'testnet') || 'currentNetwork'

    const currentTagClass =
      (isMainnet && 'mainnet') || (isTestnet && 'testnet') || 'current'

    return (
      <div className="div flex-column flex-center">
        {Array.isArray(message) ? (
          <div className="message-container">
            {this.props.Qr.message.map((message, index) => (
              <div className="qr-message" key={index}>
                {message}
              </div>
            ))}
          </div>
        ) : (
          message && <div className="qr-header">{message}</div>
        )}
        {this.props.warning
          ? this.props.warning && (
              <span className="error flex-center">{this.props.warning}</span>
            )
          : null}
        <div
          className="div qr-wrapper"
          dangerouslySetInnerHTML={{
            __html: qrImage.createTableTag(4),
          }}
        />
        <div className="address-wrapper flex-row flex-center">
          <NetworkTag
            wrapperClass={currentTagClass}
            name={this.context.t(currentTagName)}
          />
          <ReadOnlyInput
            wrapperClass="ellip-address-wrapper"
            inputClass="qr-ellip-address"
            value={data}
          />
        </div>
        {!isMainnet && (
          <div className="address-wrapper flex-row flex-center">
            <NetworkTag wrapperClass="mainnet" name="Mainnet" />
            <ReadOnlyInput
              wrapperClass="ellip-address-wrapper"
              inputClass="qr-ellip-address"
              value={mainnetBase32Address}
            />
          </div>
        )}
        {!isTestnet && (
          <div className="address-wrapper flex-row flex-center">
            <NetworkTag wrapperClass="testnet" name="Testnet" />
            <ReadOnlyInput
              wrapperClass="ellip-address-wrapper"
              inputClass="qr-ellip-address"
              value={testnetBase32Address}
            />
          </div>
        )}
      </div>
    )
  }
}

QrCodeView.propTypes = {
  warning: PropTypes.node,
  Qr: PropTypes.shape({
    message: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    data: PropTypes.string.isRequired,
    testnetBase32Address: PropTypes.string,
    mainnetBase32Address: PropTypes.string,
  }).isRequired,
}

function mapStateToProps(state) {
  return {
    // Qr code is not fetched from state. 'message' and 'data' props are passed instead.
    buyView: state.appState.buyView,
    warning: state.appState.warning,
  }
}

export default connect(mapStateToProps)(QrCodeView)
