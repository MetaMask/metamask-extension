import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import BackupNotification from './backup-notification.component'
import { showSeedPhraseBackupAfterOnboarding } from '../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    showSeedPhraseBackupAfterOnboarding: () => dispatch(showSeedPhraseBackupAfterOnboarding()),
  }
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps)
)(BackupNotification)
