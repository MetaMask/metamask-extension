import { connect } from 'react-redux'
import ProviderApproval from './provider-approval.component'
import { approveProviderRequest, rejectProviderRequest } from '../../../actions'

function mapDispatchToProps (dispatch) {
  return {
    approveProviderRequest: tabID => dispatch(approveProviderRequest(tabID)),
    rejectProviderRequest: tabID => dispatch(rejectProviderRequest(tabID)),
  }
}

export default connect(null, mapDispatchToProps)(ProviderApproval)
