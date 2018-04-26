import { connect } from 'react-redux'
import {
  getSelectedToken,
  getConvertedCurrency,
  getSendAmount,
  getGasTotal,
  getSelectedBalance,
  getTokenBalance,
  getSendFromBalance,
  getConversionRate,
} from '../../send.selectors.js'
import {
  getMaxModeOn,
  sendAmountIsInError,
  getPrimaryCurrency,
  getAmountConversionRate,
} from './send-amount-row.selectors.js'
import { getAmountErrorObject } from './send-amount-row.utils.js'
import {
  updateSendAmount,
  setMaxModeTo,
  updateSendErrors,
} from '../../../../actions'
import SendAmountRow from './send-amount-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendAmountRow)

function mapStateToProps (state) {
  return {
    selectedToken: getSelectedToken(state),
    primaryCurrency: getPrimaryCurrency(state),
    convertedCurrency: getConvertedCurrency(state),
    amountConversionRate: getAmountConversionRate(state),
    inError: sendAmountIsInError(state),
    amount: getSendAmount(state),
    maxModeOn: getMaxModeOn(state),
    gasTotal: getGasTotal(state),
    tokenBalance: getTokenBalance(state),
    balance: getSendFromBalance(state),
    conversionRate: getConversionRate(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateSendAmountError: (amountDataObject) => {
        dispatch(updateSendErrors(getAmountErrorObject(amountDataObject)))
    },
    updateSendAmount: newAmount => dispatch(updateSendAmount(newAmount)),
    setMaxModeTo: bool => dispatch(setMaxModeTo(bool)),
  }
}