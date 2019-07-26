import { connect } from 'react-redux'
import ProviderApproval from './provider-approval.component'
import { approveProviderRequestByOrigin, rejectProviderRequestByOrigin } from '../../store/actions'
import providerApprovalSelectors from './provider-approval.selectors'

function mapStateToProps (state) {
  return {
    providerRequest: providerApprovalSelectors.getProviderRequest(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    approveProviderRequestByOrigin: origin => dispatch(approveProviderRequestByOrigin(origin)),
    rejectProviderRequestByOrigin: origin => dispatch(rejectProviderRequestByOrigin(origin)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProviderApproval)
