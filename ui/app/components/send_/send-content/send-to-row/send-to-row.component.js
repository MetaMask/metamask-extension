import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component'
import EnsInput from '../../../ens-input'

export default class SendToRow extends Component {

  static propTypes = {
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    toDropdownOpen: PropTypes.bool,
    inError: PropTypes.bool,
    updateSendTo: PropTypes.func,
    updateSendToError: PropTypes.func,
    openToDropdown: PropTypes.func,
    closeToDropdown: PropTypes.func,
    network: PropTypes.string,
  };

  handleToChange (to, nickname = '') {
    const { updateSendTo, updateSendToError } = this.props
    updateSendTo(to, nickname)
    updateSendToError(to)
  }

  render () {
    const {
      from,
      fromAccounts,
      toAccounts,
      conversionRate,
      fromDropdownOpen,
      tokenContract,
      openToDropdown,
      closeToDropdown,
      network,
      inError,
      to,
      toDropdownOpen,
    } = this.props

    return (
      <SendRowWrapper
        label={`${this.context.t('to')}:`}
        showError={inError}
        errorType={'to'}
      >
        <EnsInput
          name={'address'}
          placeholder={this.context.t('recipientAddress')}
          network={network}
          to={to}
          accounts={toAccounts}
          dropdownOpen={toDropdownOpen}
          openDropdown={() => openToDropdown()}
          closeDropdown={() => closeToDropdown()}
          onChange={(newTo, newNickname) => this.handleToChange(newTo, newNickname)}
          inError={inError}
        />
      </SendRowWrapper>
    );
  }

}

SendToRow.contextTypes = {
  t: PropTypes.func,
}

