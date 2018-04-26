import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component'
import FromDropdown from './from-dropdown/from-dropdown.component'

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
    updateSendTokenBalance: PropTypes.func,
  };

  async handleFromChange (newFrom) {
    const {
      updateSendFrom,
      tokenContract,
      updateSendTokenBalance,
    } = this.props

    if (tokenContract) {
      const usersToken = await tokenContract.balanceOf(newFrom.address)
      updateSendTokenBalance(usersToken)
    }
    updateSendFrom(newFrom)
  }

  render () {
    const {
      from,
      fromAccounts,
      conversionRate,
      fromDropdownOpen,
      tokenContract,
      openFromDropdown,
      closeFromDropdown,
    } = this.props
    console.log(`$% SendFromRow fromAccounts`, fromAccounts);
    return (
      <SendRowWrapper label={`${this.context.t('from')}:`}>
        <FromDropdown
          dropdownOpen={fromDropdownOpen}
          accounts={fromAccounts}
          selectedAccount={from}
          onSelect={newFrom => this.handleFromChange(newFrom)}
          openDropdown={() => openFromDropdown()}
          closeDropdown={() => closeFromDropdown()}
          conversionRate={conversionRate}
        />
      </SendRowWrapper>
    );
  }

}

SendFromRow.contextTypes = {
  t: PropTypes.func,
}
