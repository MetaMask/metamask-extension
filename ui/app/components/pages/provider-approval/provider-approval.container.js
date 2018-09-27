import { connect } from 'react-redux'
import ProviderApproval from './provider-approval.component'
import { approveProviderRequest, rejectProviderRequest } from '../../../actions'

function mapDispatchToProps (dispatch) {
  return {
    approveProviderRequest: origin => dispatch(approveProviderRequest(origin)),
    rejectProviderRequest: origin => dispatch(rejectProviderRequest(origin)),
  }
}

export default connect(null, mapDispatchToProps)(ProviderApproval)
