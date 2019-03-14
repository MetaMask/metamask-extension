import { connect } from 'react-redux'
import UiMigrationAnnouncement from './ui-migration-annoucement.component'
import { setCompletedUiMigration } from '../../store/actions'

const mapStateToProps = (state) => {
  const shouldShowAnnouncement = !state.metamask.completedUiMigration

  return {
    shouldShowAnnouncement,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onClose () {
      dispatch(setCompletedUiMigration())
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UiMigrationAnnouncement)
