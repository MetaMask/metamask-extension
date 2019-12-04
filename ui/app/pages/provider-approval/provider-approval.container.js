import { connect } from 'react-redux'
import ProviderApproval from './provider-approval.component'
import { approveProviderRequestByOrigin, rejectProviderRequestByOrigin } from '../../store/actions'

function mapDispatchToProps (dispatch) {
  return {
    approveProviderRequestByOrigin: origin => dispatch(approveProviderRequestByOrigin(origin)),
    rejectProviderRequestByOrigin: origin => dispatch(rejectProviderRequestByOrigin(origin)),
  }
}

export default connect(null, mapDispatchToProps)(ProviderApproval)
