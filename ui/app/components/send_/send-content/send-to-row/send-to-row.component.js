import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../../../send/from-dropdown'
import ToDropdown from '../../../ens-input'

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
    network: PropTypes.number,
  };

  handleToChange (to, nickname = '') {
    const { updateSendTo, updateSendToError } = this.props
    updateSendTo(to, nickname)
    updateSendErrors(to)
  }

  render () {
    const {
      from,
      fromAccounts,
      conversionRate,
      fromDropdownOpen,
      tokenContract,
      openToDropdown,
      closeToDropdown,
      network,
      inError,
    } = this.props

    return (
      <SendRowWrapper label={`${this.context.t('to')}:`}>
        <EnsInput
          name={'address'}
          placeholder={this.context.t('recipient Address')}
          network={network},
          to={to},
          accounts={toAccounts}
          dropdownOpen={toDropdownOpen}
          openDropdown={() => openToDropdown()}
          closeDropdown={() => closeToDropdown()}
          onChange={this.handleToChange}
          inError={inError}
        />
      </SendRowWrapper>
    );
  }

}

SendToRow.contextTypes = {
  t: PropTypes.func,
}

