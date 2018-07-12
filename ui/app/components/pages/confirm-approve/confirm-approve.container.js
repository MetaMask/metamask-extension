import { connect } from 'react-redux'
import ConfirmApprove from './confirm-approve.component'

const mapStateToProps = state => {
  const { confirmTransaction } = state
  const {
    tokenData = {},
    txData: { txParams: { to: tokenAddress } = {} } = {},
    tokenProps: { tokenSymbol } = {},
  } = confirmTransaction
  const { params = [] } = tokenData

  let toAddress = ''
  let tokenAmount = ''

  if (params && params.length === 2) {
    [{ value: toAddress }, { value: tokenAmount }] = params
  }

  return {
    toAddress,
    tokenAddress,
    tokenAmount,
    tokenSymbol,
  }
}

export default connect(mapStateToProps)(ConfirmApprove)
