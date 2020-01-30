import { connect } from 'react-redux'
import TokenInput from './token-input.component'
import {getIsMainnet, getSelectedToken, getSelectedTokenExchangeRate, preferencesSelector} from '../../../selectors/selectors'

const mapStateToProps = state => {
  const { metamask: { currentCurrency } } = state
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)

  return {
    currentCurrency,
    selectedToken: getSelectedToken(state),
    selectedTokenExchangeRate: getSelectedTokenExchangeRate(state),
    hideConversion: (!isMainnet && !showFiatInTestnets),
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
