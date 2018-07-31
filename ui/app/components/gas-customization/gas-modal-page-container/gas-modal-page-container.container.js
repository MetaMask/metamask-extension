import { connect } from 'react-redux'
import GasModalPageContainer from './gas-modal-page-container.component'
import { hideModal } from '../../../actions'

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
  }
}

export default connect(null, mapDispatchToProps)(GasModalPageContainer)
