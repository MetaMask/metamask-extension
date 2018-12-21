import { connect } from 'react-redux'
import SelectedAccount from './selected-account.component'

const selectors = require('../../selectors')

const mapStateToProps = state => {
  return {    
    selectedAddress: selectors.getSelectedAddress(state),
    selectedIdentity: selectors.getSelectedIdentity(state),
    network: state.metamask.network,
  }  
}

export default connect(mapStateToProps)(SelectedAccount)