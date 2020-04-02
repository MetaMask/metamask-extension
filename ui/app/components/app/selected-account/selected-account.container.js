import { connect } from 'react-redux'
import SelectedAccount from './selected-account.component'

import { getSelectedAddress, getSelectedIdentity } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    selectedAddress: getSelectedAddress(state),
    selectedIdentity: getSelectedIdentity(state),
  }
}

export default connect(mapStateToProps)(SelectedAccount)
