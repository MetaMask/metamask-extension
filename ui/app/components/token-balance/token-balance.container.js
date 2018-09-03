import { connect } from 'react-redux'
import { compose } from 'recompose'
import withTokenTracker from '../../higher-order-components/with-token-tracker'
import TokenBalance from './token-balance.component'
import selectors from '../../selectors'

const mapStateToProps = state => {
  return {
    userAddress: selectors.getSelectedAddress(state),
  }
}

export default compose(
  connect(mapStateToProps),
  withTokenTracker
)(TokenBalance)
