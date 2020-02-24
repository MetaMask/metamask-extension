import { connect } from 'react-redux'
import { compose } from 'redux'
import withTokenTracker from '../../../helpers/higher-order-components/with-token-tracker'
import TokenBalance from './token-balance.component'
import { getSelectedAddress } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    userAddress: getSelectedAddress(state),
  }
}

export default compose(
  connect(mapStateToProps),
  withTokenTracker
)(TokenBalance)
