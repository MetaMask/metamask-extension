import { connect } from 'react-redux'
import {
  getGasTotal,
  getSendToken,
  getSendFromBalance,
  getTokenBalance,
  getSendMaxModeState,
  getSendTo,
  getSendHexData,
} from '../../../../../ui/app/selectors'
import { calcMaxAmount } from './amount-max-button.utils.js'
import {
  updateSendAmount,
  setMaxModeTo,
  updateGasData,
} from '../../../../../ui/app/actions'
import AmountMaxButton from './amount-max-button.component'

export default connect(mapStateToProps, mapDispatchToProps)(AmountMaxButton)

function mapStateToProps (state) {

  return {
    balance: getSendFromBalance(state),
    gasTotal: getGasTotal(state),
    maxModeOn: getSendMaxModeState(state),
    sendToken: getSendToken(state),
    tokenBalance: getTokenBalance(state),
    send: state.metamask.send,
    amount: state.metamask.send.amount,
    blockGasLimit: state.metamask.currentBlockGasLimit,
    address: state.metamask.selectedAddress,
    to: getSendTo(state),
    data: getSendHexData(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setAmountToMax: (maxAmountDataObject) => {
      dispatch(updateSendAmount(calcMaxAmount(maxAmountDataObject)))
    },
    clearMaxAmount: () => {
      dispatch(updateSendAmount('0'))
    },
    setMaxModeTo: (bool) => dispatch(setMaxModeTo(bool)),
    updateGasData: (params) => dispatch(updateGasData(params)),
  }
}
