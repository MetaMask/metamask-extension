import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/'
import FromDropdown from './from-dropdown/'

export default class SendFromRow extends Component {

  static propTypes = {
    closeFromDropdown: PropTypes.func,
    conversionRate: PropTypes.number,
    from: PropTypes.object,
    fromAccounts: PropTypes.array,
    fromDropdownOpen: PropTypes.bool,
    openFromDropdown: PropTypes.func,
    tokenContract: PropTypes.object,
    updateSendFrom: PropTypes.func,
    setSendTokenBalance: PropTypes.func,
  };

  async handleFromChange (newFrom) {
    const {
      updateSendFrom,
      tokenContract,
      setSendTokenBalance,
    } = this.props

    if (tokenContract) {
      const usersToken = await tokenContract.balanceOf(newFrom.address)
      setSendTokenBalance(usersToken)
    }
    updateSendFrom(newFrom)
  }

  render () {
    const {
      closeFromDropdown,
      conversionRate,
      from,
      fromAccounts,
      fromDropdownOpen,
      openFromDropdown,
    } = this.props

    return (
      <SendRowWrapper label={`${this.context.t('from')}:`}>
        <FromDropdown
          accounts={fromAccounts}
          closeDropdown={() => closeFromDropdown()}
          conversionRate={conversionRate}
          dropdownOpen={fromDropdownOpen}
          onSelect={newFrom => this.handleFromChange(newFrom)}
          openDropdown={() => openFromDropdown()}
          selectedAccount={from}
        />
      </SendRowWrapper>
    )
  }

}

SendFromRow.contextTypes = {
  t: PropTypes.func,
}
