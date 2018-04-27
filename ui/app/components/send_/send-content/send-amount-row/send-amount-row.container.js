import { connect } from 'react-redux'
import {
  getConversionRate,
  getConvertedCurrency,
  getGasTotal,
  getSelectedToken,
  getSendAmount,
  getSendFromBalance,
  getTokenBalance,
} from '../../send.selectors.js'
import {
  getAmountConversionRate,
  getPrimaryCurrency,
  sendAmountIsInError,
} from './send-amount-row.selectors.js'
import { getAmountErrorObject } from './send-amount-row.utils.js'
import {
  setMaxModeTo,
  updateSendAmount,
  updateSendErrors,
} from '../../../../actions'
import SendAmountRow from './send-amount-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendAmountRow)

function mapStateToProps (state) {
  return {
    amount: getSendAmount(state),
    amountConversionRate: getAmountConversionRate(state),
    balance: getSendFromBalance(state),
    conversionRate: getConversionRate(state),
    convertedCurrency: getConvertedCurrency(state),
    gasTotal: getGasTotal(state),
    inError: sendAmountIsInError(state),
    primaryCurrency: getPrimaryCurrency(state),
    selectedToken: getSelectedToken(state),
    tokenBalance: getTokenBalance(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setMaxModeTo: bool => dispatch(setMaxModeTo(bool)),
    updateSendAmount: newAmount => dispatch(updateSendAmount(newAmount)),
    updateSendAmountError: (amountDataObject) => {
        dispatch(updateSendErrors(getAmountErrorObject(amountDataObject)))
    },
  }
}
