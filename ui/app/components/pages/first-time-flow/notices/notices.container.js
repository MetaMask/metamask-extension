import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { markNoticeRead, setCompletedOnboarding } from '../../../../actions'
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
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Notices)
