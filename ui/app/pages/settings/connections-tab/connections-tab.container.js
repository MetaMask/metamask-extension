import ConnectionsTab from './connections-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  approveProviderRequestByOrigin,
  rejectProviderRequestByOrigin,
  showModal,
} from '../../../store/actions'

export const mapStateToProps = state => {
  const {
    activeTab,
    metamask,
  } = state
  const {
    approvedOrigins,
  } = metamask

  return {
    activeTab,
    approvedOrigins,
  }
}

export const mapDispatchToProps = dispatch => {
  return {
    approveProviderRequestByOrigin: (origin) => dispatch(approveProviderRequestByOrigin(origin)),
    rejectProviderRequestByOrigin: (origin) => dispatch(rejectProviderRequestByOrigin(origin)),
    showClearApprovalModal: () => dispatch(showModal({
      name: 'CLEAR_APPROVED_ORIGINS',
    })),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConnectionsTab)
