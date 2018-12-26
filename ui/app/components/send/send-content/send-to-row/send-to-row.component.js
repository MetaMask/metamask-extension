import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/'
import EnsInput from '../../../ens-input'
import { getToErrorObject } from './send-to-row.utils.js'
import { isRskNetwork } from '../../../../util'

export default class SendToRow extends Component {

  static propTypes = {
    closeToDropdown: PropTypes.func,
    hasHexData: PropTypes.bool.isRequired,
    inError: PropTypes.bool,
    network: PropTypes.string,
    openToDropdown: PropTypes.func,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    toDropdownOpen: PropTypes.bool,
    updateGas: PropTypes.func,
    updateSendTo: PropTypes.func,
    updateSendToError: PropTypes.func,
    scanQrCode: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleToChange (to, nickname = '', toError, network) {

    if (isRskNetwork(network)){
      to = to.toLowerCase();
    }

    const { hasHexData, updateSendTo, updateSendToError, updateGas } = this.props
    const toErrorObject = getToErrorObject(to, toError, hasHexData)
    updateSendTo(to, nickname)
    updateSendToError(toErrorObject)
    if (toErrorObject.to === null) {
      updateGas({ to })
    }
  }

  render () {
    const {
      closeToDropdown,
      inError,
      network,
      openToDropdown,
      to,
      toAccounts,
      toDropdownOpen,
    } = this.props

    return (
      
      <SendRowWrapper
        errorType={'to'}
        label={`${this.context.t('to')}: `}
        showError={inError}
      >
        <EnsInput
          scanQrCode={_ => this.props.scanQrCode()}
          accounts={toAccounts}
          closeDropdown={() => closeToDropdown()}
          dropdownOpen={toDropdownOpen}
          inError={inError}
          name={'address'}
          network={network}
          onChange={({ toAddress, nickname, toError }) => this.handleToChange(toAddress, nickname, toError, this.props.network)}
          openDropdown={() => openToDropdown()}
          placeholder={this.context.t('recipientAddress')}
          to={to}
        />
      </SendRowWrapper>
    )
  }

}
