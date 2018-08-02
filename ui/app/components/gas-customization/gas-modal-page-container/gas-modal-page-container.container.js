import { connect } from 'react-redux'
import GasModalPageContainer from './gas-modal-page-container.component'
import { hideModal } from '../../../actions'
import {
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../ducks/custom-gas'
import {
  getCustomGasPrice,
  getCustomGasLimit,
} from '../../../selectors/custom-gas'

const mapStateToProps = state => {
  return {
    customGasPrice: getCustomGasPrice(state),
    customGasLimit: getCustomGasLimit(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
    updateCustomGasPrice: (newPrice) => dispatch(setCustomGasPrice(newPrice)),
    updateCustomGasLimit: (newLimit) => dispatch(setCustomGasLimit(newLimit)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GasModalPageContainer)
