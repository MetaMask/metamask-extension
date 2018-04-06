import {
  getSelectedToken,
  getPrimaryCurrency,
  getAmountConversionRate,
  getConvertedCurrency,
  getSendAmount,
  getGasTotal,
  getSelectedBalance,
  getTokenBalance,
} from '../../send.selectors.js'
import {
  getMaxModeOn,
  getSendAmountError,
} from './send-amount-row.selectors.js'
import { getAmountErrorObject } from './send-to-row.utils.js'
import {
  updateSendErrors,
  updateSendTo,
} from '../../../actions'
import {
  openToDropdown,
  closeToDropdown,
} from '../../../ducks/send'
import SendToRow from './send-to-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendToRow)

function mapStateToProps (state) {
updateSendTo
return {
  to: getSendTo(state),
  toAccounts: getSendToAccounts(state),
  toDropdownOpen: getToDropdownOpen(state),
  inError: sendToIsInError(state),
  network: getCurrentNetwork(state),
}
}

function mapDispatchToProps (dispatch) {
return {
  updateSendToError: (to) => {
      dispatch(updateSendErrors(getToErrorObject(to)))
  },
  updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
  openToDropdown: () => dispatch(()),
  closeToDropdown: () => dispatch(()),
}
}