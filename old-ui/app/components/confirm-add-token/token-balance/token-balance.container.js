import { connect } from 'react-redux'
import { compose } from 'recompose'
import withTokenTracker from '../../../../../ui/app/helpers/with-token-tracker'
import TokenBalance from './token-balance.component'
import selectors from '../../../../../ui/app/selectors'

const mapStateToProps = state => {
  return {
    userAddress: selectors.getSelectedAddress(state),
  }
}

export default compose(
  connect(mapStateToProps),
  withTokenTracker
)(TokenBalance)
