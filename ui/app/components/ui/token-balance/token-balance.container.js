import { connect } from 'react-redux'
import { compose } from 'recompose'
import withTokenTracker from '../../../helpers/higher-order-components/with-token-tracker'
import TokenBalance from './token-balance.component'
import selectors from '../../../selectors/selectors'

const mapStateToProps = state => {
  return {
    userAddress: selectors.getSelectedAddress(state),
  }
}

export default compose(
  connect(mapStateToProps),
  withTokenTracker
)(TokenBalance)
