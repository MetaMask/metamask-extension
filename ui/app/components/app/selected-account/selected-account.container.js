import { connect } from 'react-redux'
import SelectedAccount from './selected-account.component'

import { getSelectedIdentity } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    selectedIdentity: getSelectedIdentity(state),
  }
}

export default connect(mapStateToProps)(SelectedAccount)
