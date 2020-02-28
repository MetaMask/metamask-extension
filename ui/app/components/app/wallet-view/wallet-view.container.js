import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import WalletView from './wallet-view.component'
import { getSelectedAddress } from '../../../selectors/selectors'

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    keyrings: state.metamask.keyrings,
    selectedAddress: getSelectedAddress(state),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(WalletView)
