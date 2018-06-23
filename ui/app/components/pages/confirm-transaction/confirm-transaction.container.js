import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import ConfirmTransaction from './confirm-transaction.component'
import { getTotalUnapprovedCount } from '../../../selectors'

const mapStateToProps = (state, props) => {
  const { metamask: { send } } = state

  return {
    totalUnapprovedCount: getTotalUnapprovedCount(state),
    send,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ConfirmTransaction)
