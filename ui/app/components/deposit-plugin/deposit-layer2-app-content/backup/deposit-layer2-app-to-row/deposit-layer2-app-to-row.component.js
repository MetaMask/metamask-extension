import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DepositLayer2AppRowWrapper from '../deposit-layer2-app-row-wrapper/'
import EnsInput from '../../../ens-input'
import { getToErrorObject } from './send-to-row.utils.js'

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
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleToChange (to, nickname = '', toError) {
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
      <DepositLayer2AppRowWrapper
        errorType={'layer2App'}
        label={`${this.context.t('layer2App')}: `}
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
          onChange={({ toAddress, nickname, toError }) => this.handleToChange(toAddress, nickname, toError)}
          openDropdown={() => openToDropdown()}
          placeholder={this.context.t('layer2AppAddress')}
          to={to}
        />
      </DepositLayer2AppRowWrapper>
    )
  }

}
