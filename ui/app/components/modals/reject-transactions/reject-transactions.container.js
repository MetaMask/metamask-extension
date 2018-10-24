import { connect } from 'react-redux'
import { compose } from 'recompose'
import RejectTransactionsModal from './reject-transactions.component'
import withModalProps from '../../../higher-order-components/with-modal-props'

const mapStateToProps = (state, ownProps) => {
  const { unapprovedTxCount } = ownProps

  return {
    unapprovedTxCount,
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps),
)(RejectTransactionsModal)
