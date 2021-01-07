import React, { Component } from 'react'
import PropTypes from 'prop-types'
import QRCode from 'qrcode.react'
import Button from '../../../ui/button'

export default class BidirectionalTransactionDisplay extends Component {
  static propTypes = {
    transactionData: PropTypes.array.isRequired,
    hideModal: PropTypes.func,
    cancelTransaction: PropTypes.func,
    showBidirectionalSignatureImporter: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
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
          current: (state.current + 1) % state.total,
        }
      })
    }, 500)
  }

  handleCancel() {
    const { hideModal, cancelTransaction } = this.props
    hideModal()
    cancelTransaction()
  }

  render() {
    const { current } = this.state
    const { transactionData, showBidirectionalSignatureImporter } = this.props
    return (
      <div className="qr-scanner">
        <div className="qr-scanner__title">
          <p>{this.context.t('scanWithCoboVault')}</p>
        </div>
        <div
          className="qr-scanner__content"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            marginBottom: 20,
          }}
        >
          <QRCode value={transactionData[current]} size={250} />
        </div>
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          {this.context.t('scanCoboDescription')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Button
            type="default"
            onClick={() => {
              this.handleCancel()
            }}
          >
            {this.context.t('cancelTransaction')}
          </Button>
          <Button type="secondary" onClick={showBidirectionalSignatureImporter}>
            {this.context.t('getSignatureFromCoboVault')}
          </Button>
        </div>
      </div>
    )
  }
}
