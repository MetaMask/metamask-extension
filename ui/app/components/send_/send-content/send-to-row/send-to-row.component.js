import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/'
import EnsInput from '../../../ens-input'

export default class SendToRow extends Component {

  static propTypes = {
    closeToDropdown: PropTypes.func,
    inError: PropTypes.bool,
    network: PropTypes.string,
    openToDropdown: PropTypes.func,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    toDropdownOpen: PropTypes.bool,
    updateSendTo: PropTypes.func,
    updateSendToError: PropTypes.func,
  };

  handleToChange (to, nickname = '') {
    const { updateSendTo, updateSendToError } = this.props
    updateSendTo(to, nickname)
    updateSendToError(to)
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
        label={`${this.context.t('to')}:`}
        showError={inError}
      >
        <EnsInput
          accounts={toAccounts}
          closeDropdown={() => closeToDropdown()}
          dropdownOpen={toDropdownOpen}
          inError={inError}
          name={'address'}
          network={network}
          onChange={(newTo, newNickname) => this.handleToChange(newTo, newNickname)}
          openDropdown={() => openToDropdown()}
          placeholder={this.context.t('recipientAddress')}
          to={to}
        />
      </SendRowWrapper>
    )
  }

}

SendToRow.contextTypes = {
  t: PropTypes.func,
}

