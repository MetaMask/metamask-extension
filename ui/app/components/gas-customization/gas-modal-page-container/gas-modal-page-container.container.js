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

const mockGasPriceButtonGroupProps = {
  buttonDataLoading: false,
  className: 'gas-price-button-group',
  gasButtonInfo: [
    {
      feeInPrimaryCurrency: '$0.52',
      feeInSecondaryCurrency: '0.0048 ETH',
      timeEstimate: '~ 1 min 0 sec',
      priceInHexWei: '0xa1b2c3f',
    },
    {
      feeInPrimaryCurrency: '$0.39',
      feeInSecondaryCurrency: '0.004 ETH',
      timeEstimate: '~ 1 min 30 sec',
      priceInHexWei: '0xa1b2c39',
    },
    {
      feeInPrimaryCurrency: '$0.30',
      feeInSecondaryCurrency: '0.00354 ETH',
      timeEstimate: '~ 2 min 1 sec',
      priceInHexWei: '0xa1b2c30',
    },
  ],
  handleGasPriceSelection: newPrice => console.log('NewPrice: ', newPrice),
  noButtonActiveByDefault: true,
  showCheck: true,
}

const mapStateToProps = state => {
  return {
    customGasPrice: getCustomGasPrice(state),
    customGasLimit: getCustomGasLimit(state),
    gasPriceButtonGroupProps: mockGasPriceButtonGroupProps,
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
