import { connect } from 'react-redux'
import {
  getAmountConversionRate,
  getConversionRate,
  getCurrentCurrency,
  getGasTotal,
  getPrimaryCurrency,
  getSelectedToken,
  getSendAmount,
  getSendFromBalance,
  getTokenBalance,
} from '../../send.selectors'
import {
  sendAmountIsInError,
} from './send-amount-row.selectors'
import { getAmountErrorObject, getGasFeeErrorObject } from '../../send.utils'
import {
  setMaxModeTo,
  updateSendAmount,
} from '../../../../store/actions'
import {
  updateSendErrors,
} from '../../../../ducks/send/send.duck'
import SendAmountRow from './send-amount-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendAmountRow)

function mapStateToProps (state) {
  return {
    amount: getSendAmount(state),
    amountConversionRate: getAmountConversionRate(state),
    balance: getSendFromBalance(state),
    conversionRate: getConversionRate(state),
    convertedCurrency: getCurrentCurrency(state),
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
    updateGasFeeError: (amountDataObject) => {
      dispatch(updateSendErrors(getGasFeeErrorObject(amountDataObject)))
    },
    updateSendAmountError: (amountDataObject) => {
      dispatch(updateSendErrors(getAmountErrorObject(amountDataObject)))
    },
  }
}
