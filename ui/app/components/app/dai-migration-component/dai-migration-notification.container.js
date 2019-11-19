import { connect } from 'react-redux'
import { compose } from 'recompose'
import DaiMigrationNotification from './dai-migration-notification.component'
import withTokenTracker from '../../../helpers/higher-order-components/with-token-tracker'
import { getSelectedAddress, getDaiV1Token } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  const userAddress = getSelectedAddress(state)
  const oldDai = getDaiV1Token(state)

  return {
    userAddress,
    token: oldDai,
  }
}

export default compose(
  connect(mapStateToProps),
  withTokenTracker,
)(DaiMigrationNotification)
