import { connect } from 'react-redux'
import {
  getSelectedToken,
  getGasTotal,
  getTokenBalance,
  getSendFromBalance,
} from '../../../send.selectors.js'
import { getMaxModeOn } from '../send-amount-row.selectors.js'
import { calcMaxAmount } from './amount-max-button.utils.js'
import {
  updateSendAmount,
  setMaxModeTo,
} from '../../../actions'
import AmountMaxButton from './amount-max-button.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendToRow)

function mapStateToProps (state) {

  return {
    selectedToken: getSelectedToken(state),
    maxModeOn: getMaxModeOn(state),
    gasTotal: getGasTotal(state),
    tokenBalance: getTokenBalance(state),
    balance: getSendFromBalance(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setAmountToMax: maxAmountDataObject => {
      updateSendErrors({ amount: null })
      updateSendAmount(calcMaxAmount(maxAmountDataObject))
    }
    setMaxModeTo: bool => dispatch(setMaxModeTo(bool)),
  }
}