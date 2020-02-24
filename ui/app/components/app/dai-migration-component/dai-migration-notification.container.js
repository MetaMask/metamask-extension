import { connect } from 'react-redux'
import { compose } from 'redux'
import DaiMigrationNotification from './dai-migration-notification.component'
import withTokenTracker from '../../../helpers/higher-order-components/with-token-tracker'
import { getSelectedAddress, getDaiV1Token } from '../../../selectors/selectors'
import { setMkrMigrationReminderTimestamp } from '../../../store/actions'

const mapStateToProps = (state) => {
  const {
    metamask: {
      mkrMigrationReminderTimestamp,
    },
  } = state

  const userAddress = getSelectedAddress(state)
  const oldDai = getDaiV1Token(state)

  return {
    mkrMigrationReminderTimestamp,
    userAddress,
    token: oldDai,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setMkrMigrationReminderTimestamp: (t) => dispatch(setMkrMigrationReminderTimestamp(t)),
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTokenTracker,
)(DaiMigrationNotification)
