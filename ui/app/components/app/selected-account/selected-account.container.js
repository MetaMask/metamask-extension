import { connect } from 'react-redux'
import SelectedAccount from './selected-account.component'

import {
  getSelectedBase32Address,
  getSelectedIdentity,
} from '../../../selectors/selectors'

const mapStateToProps = state => {
  return {
    selectedBase32Address: getSelectedBase32Address(state),
    selectedIdentity: getSelectedIdentity(state),
  }
}

export default connect(mapStateToProps)(SelectedAccount)
