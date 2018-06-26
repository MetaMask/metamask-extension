import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/'
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component'

export default class SendGasRow extends Component {

  static propTypes = {
    conversionRate: PropTypes.number,
    convertedCurrency: PropTypes.string,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
  };

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
