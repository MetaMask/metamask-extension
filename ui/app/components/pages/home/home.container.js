import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

const mapStateToProps = state => {
  const { metamask, appState } = state
  const {
    unapprovedTxs = {},
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
    noActiveNotices,
    lostAccounts,
    seedWords,
  } = metamask
  const { forgottenPassword } = appState

  return {
    unapprovedTxs,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
    noActiveNotices,
    lostAccounts,
    forgottenPassword,
    seedWords,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Home)
