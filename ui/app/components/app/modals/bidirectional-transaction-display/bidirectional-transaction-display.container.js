import { connect } from 'react-redux'
import { encodeUR } from '@cvbb/bc-ur'
import {
  hideModal,
  showBidirectionalSignatureImporter,
  cancelBidirectionalTransaction,
} from '../../../../store/actions'
import BidirectionalTransactionDisplay from './bidirectional-transaction-display.component'

const mapStateToProps = (state) => {
  return {
    transactionData: encodeUR(
      Buffer.from(JSON.stringify(state.metamask.signPayload), 'utf8').toString(
        'hex',
      ),
      800,
    ),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    showBidirectionalSignatureImporter: () =>
      dispatch(showBidirectionalSignatureImporter()),
    cancelTransaction: () => dispatch(cancelBidirectionalTransaction())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BidirectionalTransactionDisplay)
