import PropTypes from 'prop-types'
import React from 'react'
import qrCode from 'qrcode-generator'
import { connect } from 'react-redux'
import ReadOnlyInput from './readonly-input'

export default connect(mapStateToProps)(QrCodeView)

function mapStateToProps(state) {
  return {
    // Qr code is not fetched from state. 'message' and 'data' props are passed instead.
    buyView: state.appState.buyView,
    warning: state.appState.warning,
  }
}

function QrCodeView(props) {
  const { message, data } = props.Qr
  const address = `conflux:${data}`
  const qrImage = qrCode(4, 'M')
  qrImage.addData(address)
  qrImage.make()

  return (
    <div className="div flex-column flex-center">
      {Array.isArray(message) ? (
        <div className="message-container">
          {props.Qr.message.map((message, index) => (
            <div className="qr-message" key={index}>
              {message}
            </div>
          ))}
        </div>
      ) : (
        message && <div className="qr-header">{message}</div>
      )}
      {props.warning
        ? props.warning && (
            <span className="error flex-center">{props.warning}</span>
          )
        : null}
      <div
        className="div qr-wrapper"
        dangerouslySetInnerHTML={{
          __html: qrImage.createTableTag(4),
        }}
      />
      <ReadOnlyInput
        wrapperClass="ellip-address-wrapper"
        inputClass="qr-ellip-address"
        value={data}
      />
    </div>
  )
}

QrCodeView.propTypes = {
  warning: PropTypes.node,
  Qr: PropTypes.shape({
    message: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    data: PropTypes.string.isRequired,
  }).isRequired,
}
