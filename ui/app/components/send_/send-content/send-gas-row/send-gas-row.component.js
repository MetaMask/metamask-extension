import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component'
import GasFeeDisplay from '../../../send/gas-fee-display-v2'

export default class SendGasRow extends Component {

  static propTypes = {
    closeFromDropdown: PropTypes.func,
    conversionRate: PropTypes.number,
    from: PropTypes.string,
    fromAccounts: PropTypes.array,
    fromDropdownOpen: PropTypes.bool,
    openFromDropdown: PropTypes.func,
    tokenContract: PropTypes.object,
    updateSendFrom: PropTypes.func,
    updateSendTokenBalance: PropTypes.func,
    gasLoadingError: PropTypes.bool,
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
      conversionRate,
      convertedCurrency,
      showCustomizeGasModal,
      gasTotal,
      gasLoadingError,
    } = this.props

    return (
      <SendRowWrapper label={`${this.context.t('gasFee')}:`}>
        <GasFeeDisplay
          gasTotal={gasTotal}
          conversionRate={conversionRate}
          convertedCurrency={convertedCurrency}
          onClick={() => showCustomizeGasModal()}
          gasLoadingError={gasLoadingError}
        />
      </SendRowWrapper>
    );
  }

}

SendGasRow.contextTypes = {
  t: PropTypes.func,
}
