import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/'
import EnsInput from '../../../ens-input'
import { getToErrorObject, getToWarningObject } from './send-to-row.utils.js'

export default class SendToRow extends Component {

  static propTypes = {
    closeToDropdown: PropTypes.func,
    hasHexData: PropTypes.bool.isRequired,
    inError: PropTypes.bool,
    inWarning: PropTypes.bool,
    network: PropTypes.string,
    openToDropdown: PropTypes.func,
    selectedToken: PropTypes.object,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    toDropdownOpen: PropTypes.bool,
    tokens: PropTypes.array,
    updateGas: PropTypes.func,
    updateSendTo: PropTypes.func,
    updateSendToError: PropTypes.func,
    updateSendToWarning: PropTypes.func,
    scanQrCode: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleToChange (to, nickname = '', toError, toWarning) {
    const { hasHexData, updateSendTo, updateSendToError, updateGas, tokens, selectedToken, updateSendToWarning } = this.props
    const toErrorObject = getToErrorObject(to, toError, hasHexData)
    const toWarningObject = getToWarningObject(to, toWarning, tokens, selectedToken)
    updateSendTo(to, nickname)
    updateSendToError(toErrorObject)
    updateSendToWarning(toWarningObject)
    if (toErrorObject.to === null) {
      updateGas({ to })
    }
  }

  render () {
    const {
      closeToDropdown,
      inError,
      inWarning,
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
        showWarning={inWarning}
        warningType={'to'}
        >
        <EnsInput
          scanQrCode={_ => this.props.scanQrCode()}
          accounts={toAccounts}
          closeDropdown={() => closeToDropdown()}
          dropdownOpen={toDropdownOpen}
          inError={inError}
          name={'address'}
          network={network}
          onChange={({ toAddress, nickname, toError, toWarning }) => this.handleToChange(toAddress, nickname, toError, toWarning)}
          openDropdown={() => openToDropdown()}
          placeholder={this.context.t('recipientAddress')}
          to={to}
        />
      </SendRowWrapper>
    )
  }

}
