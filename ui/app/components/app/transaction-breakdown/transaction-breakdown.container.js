import { connect } from 'react-redux'
import { getIsMainnet, getNativeCurrency, getPreferences } from '../../../selectors'
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util'
import { sumHexes } from '../../../helpers/utils/transactions.util'
import { TRANSACTION_TYPE_TOKEN_METHOD_APPROVE } from '../../../../../shared/constants/transaction'
import TransactionBreakdown from './transaction-breakdown.component'

const mapStateToProps = (state, ownProps) => {
  const { transaction, type } = ownProps
  const { txParams: { gas, gasPrice, value } = {}, txReceipt: { gasUsed } = {} } = transaction
  const { showFiatInTestnets } = getPreferences(state)
  const isMainnet = getIsMainnet(state)
  const isTokenApprove = type === TRANSACTION_TYPE_TOKEN_METHOD_APPROVE

  const gasLimit = typeof gasUsed === 'string' ? gasUsed : gas

  const hexGasTotal = (gasLimit && gasPrice && getHexGasTotal({ gasLimit, gasPrice })) || '0x0'
  const totalInHex = sumHexes(hexGasTotal, value)

  return {
    nativeCurrency: getNativeCurrency(state),
    showFiat: (isMainnet || Boolean(showFiatInTestnets)),
    totalInHex,
    gas,
    gasPrice,
    gasUsed,
    isTokenApprove,
  }
}

export default connect(mapStateToProps)(TransactionBreakdown)
