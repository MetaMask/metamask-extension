import {
  getSelectedToken,
  getPrimaryCurrency,
  getAmountConversionRate,
  getConvertedCurrency,
  getSendAmount,
  getGasTotal,
  getSelectedBalance,
  getTokenBalance,
  getSendFromBalance,
} from '../../send.selectors.js'
import {
  getMaxModeOn,
  sendAmountIsInError,
} from './send-amount-row.selectors.js'
import { getAmountErrorObject } from './send-amount-row.utils.js'
import {
  updateSendAmount,
  setMaxModeTo,
} from '../../../actions'
import SendAmountRow from './send-amount-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendToRow)

function mapStateToProps (state) {
updateSendTo
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