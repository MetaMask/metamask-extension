import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { markNoticeRead, showModal, setCompletedOnboarding } from '../../../../actions'
import Notices from './notices.component'

const mapStateToProps = ({ metamask }) => {
  const { selectedAddress, nextUnreadNotice, noActiveNotices } = metamask

  return {
    address: selectedAddress,
    nextUnreadNotice,
    noActiveNotices,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    markNoticeRead: notice => dispatch(markNoticeRead(notice)),
    openBuyEtherModal: () => dispatch(showModal({ name: 'DEPOSIT_ETHER'})),
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Notices)
