import { connect } from 'react-redux'
import GasModalPageContainer from './gas-modal-page-container.component'
import { hideModal } from '../../../actions'
import {
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../ducks/gas.duck'
import {
  getCustomGasPrice,
  getCustomGasLimit,
  getRenderableBasicEstimateData,
  getBasicGasEstimateLoadingStatus,
} from '../../../selectors/custom-gas'

const mapStateToProps = state => {
  const buttonDataLoading = getBasicGasEstimateLoadingStatus(state)
  return {
    customGasPrice: getCustomGasPrice(state),
    customGasLimit: getCustomGasLimit(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading,
      gasButtonInfo: getRenderableBasicEstimateData(state),
    },
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
    updateCustomGasPrice: (newPrice) => dispatch(setCustomGasPrice(newPrice)),
    updateCustomGasLimit: (newLimit) => dispatch(setCustomGasLimit(newLimit)),
    handleGasPriceSelection: newPrice => console.log('NewPrice: ', newPrice),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GasModalPageContainer)
