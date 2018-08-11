import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerContent from '../../page-container/page-container-content.component'
import SendAmountRow from './send-amount-row/'
import SendFromRow from './send-from-row/'
import SendGasRow from './send-gas-row/'
import SendHexDataRow from './send-hex-data-row'
import SendToRow from './send-to-row/'

export default class SendContent extends Component {

  static propTypes = {
    updateGas: PropTypes.func,
    scanQrCode: PropTypes.func,
  };

  render () {
    return (
      <PageContainerContent>
        <div className="send-v2__form">
          <SendFromRow />
          <SendToRow
            updateGas={(updateData) => this.props.updateGas(updateData)}
            scanQrCode={ _ => this.props.scanQrCode()}
          />
          <SendAmountRow updateGas={(updateData) => this.props.updateGas(updateData)} />
          <SendGasRow />
          <SendHexDataRow />
        </div>
      </PageContainerContent>
    )
  }

}
