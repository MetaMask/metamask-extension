import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component'
import AmountMaxButton from '../amount-max-button/amount-max-button.component'
import CurrencyDisplay from '../../../send/currency-display'

export default class SendAmountRow extends Component {

  static propTypes = {
    amountConversionRate: PropTypes.string,
    conversionRate: PropTypes.string,
    from: PropTypes.object,
    gasTotal: PropTypes.string,
    primaryCurrency: PropTypes.string,
    selectedToken: PropTypes.object,
    tokenBalance: PropTypes.string,
    updateSendAmountError: PropTypes.func,
    updateSendAmount: PropTypes.func,
    setMaxModeTo: PropTypes.func
  }

  validateAmount (amount) {
    const {
      amountConversionRate,
      conversionRate,
      from: { balance },
      gasTotal,
      primaryCurrency,
      selectedToken,
      tokenBalance,
      updateSendAmountError,
    } = this.props

    updateSendAmountError({
      amount,
      amountConversionRate,
      balance,
      conversionRate,
      gasTotal,
      primaryCurrency,
      selectedToken,
      tokenBalance,
    })
  }

  handleAmountChange (amount) {
    const { updateSendAmount, setMaxModeTo } = this.props

    setMaxModeTo(false)
    this.validateAmount(amount)
    updateSendAmount(amount)
  }

  render () {
    const {
      amount,
      amountConversionRate,
      convertedCurrency,
      inError,
      gasTotal,
      maxModeOn,
      primaryCurrency = 'ETH',
      selectedToken,
    } = this.props

    return (
      <SendRowWrapper
        label={`${this.context.t('amount')}:`}
        showError={inError}
        errorType={'amount'}
      >
        !inError && gasTotal && <AmountMaxButton />
        <CurrencyDisplay
          inError={inError},
          primaryCurrency={primaryCurrency},
          convertedCurrency={convertedCurrency},
          selectedToken={selectedToken},
          value={amount || '0x0'},
          conversionRate={amountConversionRate},
          handleChange={this.handleAmountChange},
        >
      </SendRowWrapper>
    );
  }

}

SendAmountRow.contextTypes = {
  t: PropTypes.func,
}

