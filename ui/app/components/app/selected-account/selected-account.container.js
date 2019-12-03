import { connect } from 'react-redux'
import SelectedAccount from './selected-account.component'

const { getSelectedAddress, getSelectedIdentity } = require('../../../selectors/selectors')

const mapStateToProps = state => {
  return {
    selectedAddress: getSelectedAddress(state),
    selectedIdentity: getSelectedIdentity(state),
    network: state.metamask.network,
  }
}

export default connect(mapStateToProps)(SelectedAccount)
