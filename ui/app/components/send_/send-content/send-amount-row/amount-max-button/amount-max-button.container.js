import { connect } from 'react-redux'
import {
  getGasTotal,
  getSelectedToken,
  getSendFromBalance,
  getTokenBalance,
} from '../../../send.selectors.js'
import { getMaxModeOn } from '../send-amount-row.selectors.js'
import { calcMaxAmount } from './amount-max-button.utils.js'
import {
  updateSendAmount,
  setMaxModeTo,
} from '../../../../../actions'
import AmountMaxButton from './amount-max-button.component'
import {
  updateSendErrors,
} from '../../../../../ducks/send'

export default connect(mapStateToProps, mapDispatchToProps)(AmountMaxButton)

function mapStateToProps (state) {

  return {
    balance: getSendFromBalance(state),
    gasTotal: getGasTotal(state),
    maxModeOn: getMaxModeOn(state),
    selectedToken: getSelectedToken(state),
    tokenBalance: getTokenBalance(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setAmountToMax: maxAmountDataObject => {
      updateSendErrors({ amount: null })
      updateSendAmount(calcMaxAmount(maxAmountDataObject))
    },
    setMaxModeTo: bool => dispatch(setMaxModeTo(bool)),
  }
}
