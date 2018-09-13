import { connect } from 'react-redux'
import {
  getConversionRate,
  getCurrentCurrency,
  getGasTotal,
  getGasPrice,
} from '../../send.selectors.js'
import{
  getBasicGasEstimateLoadingStatus,
  getRenderableEstimateDataForSmallButtons,
  getDefaultActiveButtonIndex
} from '../../../../selectors/custom-gas'
import{
  showGasButtonGroup
} from '../../../../ducks/send.duck'
import { getGasLoadingError, gasFeeIsInError, getGasButtonGroupShown } from './send-gas-row.selectors.js'
import { showModal, setGasPrice } from '../../../../actions'
import SendGasRow from './send-gas-row.component'

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(SendGasRow)

function mapStateToProps (state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtons(state)
  const activeButtonIndex = getDefaultActiveButtonIndex(gasButtonInfo, getGasPrice(state))

  return {
    conversionRate: getConversionRate(state),
    convertedCurrency: getCurrentCurrency(state),
    gasTotal: getGasTotal(state),
    gasFeeError: gasFeeIsInError(state),
    gasLoadingError: getGasLoadingError(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading: getBasicGasEstimateLoadingStatus(state),
      defaultActiveButtonIndex: 1,
      newActiveButtonIndex: activeButtonIndex > -1 ? activeButtonIndex : null,
      gasButtonInfo,
    },
    gasButtonGroupShown: getGasButtonGroupShown(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(showModal({ name: 'CUSTOMIZE_GAS', hideBasic: true })),
    setGasPrice: newPrice => dispatch(setGasPrice(newPrice)),
    showGasButtonGroup: () => dispatch(showGasButtonGroup())
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const { gasPriceButtonGroupProps } = stateProps
  const {
    setGasPrice: dispatchSetGasPrice,
    ...otherDispatchProps
  } = dispatchProps

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: dispatchSetGasPrice,
    },
  }
}