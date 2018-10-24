import { connect } from 'react-redux'
import TokenInput from './token-input.component'
import { getSelectedToken, getSelectedTokenExchangeRate } from '../../selectors'

const mapStateToProps = state => {
  const { metamask: { currentCurrency } } = state

  return {
    currentCurrency,
    selectedToken: getSelectedToken(state),
    selectedTokenExchangeRate: getSelectedTokenExchangeRate(state),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { selectedToken } = stateProps
  const suffix = selectedToken && selectedToken.symbol

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    suffix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(TokenInput)
