import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component'
import SendAmountRow from './send-amount-row'
import SendFromRow from './send-from-row'
import SendGasRow from './send-gas-row'
import SendHexDataRow from './send-hex-data-row'
import SendToRow from './send-to-row'
import SendAssetRow from "./send-asset-row"

export default class SendContent extends Component {

  static propTypes = {
    updateGas: PropTypes.func,
    scanQrCode: PropTypes.func,
    showHexData: PropTypes.bool,
    editingTransactionId: PropTypes.string,
  }

  updateGas = (updateData) => this.props.updateGas(updateData)

  isEditing = () => !!this.props.editingTransactionId

  render () {
    return (
      <PageContainerContent>
        <div className="send-v2__form">
          <SendFromRow />
          <SendToRow
            updateGas={this.updateGas}
            scanQrCode={ _ => this.props.scanQrCode()}
          />
          { !this.isEditing() && <SendAssetRow /> }
          <SendAmountRow updateGas={this.updateGas} />
          <SendGasRow />
          {(this.props.showHexData && (
            <SendHexDataRow
              updateGas={this.updateGas}
            />
          ))}
        </div>
      </PageContainerContent>
    )
  }

}
