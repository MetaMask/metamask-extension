import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component'
import GasFeeDisplay from '../../../send/gas-fee-display-v2'

export default class SendGasRow extends Component {

  static propTypes = {
    closeFromDropdown: PropTypes.func,
    conversionRate: PropTypes.number,
    convertedCurrency: PropTypes.string,
    from: PropTypes.string,
    fromAccounts: PropTypes.array,
    fromDropdownOpen: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    openFromDropdown: PropTypes.func,
    showCustomizeGasModal: PropTypes.func,
    tokenContract: PropTypes.object,
    updateSendFrom: PropTypes.func,
    updateSendTokenBalance: PropTypes.func,
  };

  async handleFromChange (newFrom) {
    const {
      tokenContract,
      updateSendFrom,
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
      gasLoadingError,
      gasTotal,
      showCustomizeGasModal,
    } = this.props

    return (
      <SendRowWrapper label={`${this.context.t('gasFee')}:`}>
        <GasFeeDisplay
          conversionRate={conversionRate}
          convertedCurrency={convertedCurrency}
          gasLoadingError={gasLoadingError}
          gasTotal={gasTotal}
          onClick={() => showCustomizeGasModal()}
        />
      </SendRowWrapper>
    )
  }

}

SendGasRow.contextTypes = {
  t: PropTypes.func,
}
