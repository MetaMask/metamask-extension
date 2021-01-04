import React, { Component } from 'react'
import PropTypes from 'prop-types'
import QRCode from 'qrcode.react'

export default class BidirectionalTransactionDisplay extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    transactionData: PropTypes.array.isRequired,
    showBidirectionalSignatureImporter: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      current: 0,
      total: props.transactionData.length,
    }
  }

  componentDidMount() {
    setInterval(() => {
      this.setState((state) => {
        return {
          current: state.current + (1 % state.total),
        }
      })
    }, 500)
  }

  render() {
    const { current } = this.state
    const { transactionData, showBidirectionalSignatureImporter } = this.props
    return (
      <div className="qr-scanner">
        <div className="qr-scanner__title">
          <p>Scan with Cobo Vault</p>
        </div>
        <div
          className="qr-scanner__content"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <QRCode value={transactionData[current]} size={250} />
        </div>
        <button
          onClick={showBidirectionalSignatureImporter}
          style={{ height: 48 }}
        >
          Get Signature
        </button>
      </div>
    )
  }
}
