import { connect } from 'react-redux'
import {
    getConversionRate,
    getCurrentCurrency,
    getGasTotal,
    getGasPrice,
} from '../../send.selectors.js'
import {
  getBasicGasEstimateLoadingStatus,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from '../../../../selectors/custom-gas'
import {
  showGasButtonGroup,
} from '../../../../ducks/send.duck'
import {
  resetCustomData,
} from '../../../../ducks/gas.duck'
import { getGasLoadingError, gasFeeIsInError, getGasButtonGroupShown } from './send-gas-row.selectors.js'
import { showModal, setGasPrice } from '../../../../actions'
import SendGasRow from './send-gas-row.component'

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(SendGasRow)

function mapStateToProps (state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state)
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
    showGasButtonGroup: () => dispatch(showGasButtonGroup()),
    resetCustomData: () => dispatch(resetCustomData()),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const { gasPriceButtonGroupProps } = stateProps
  const { gasButtonInfo } = gasPriceButtonGroupProps
  const {
    setGasPrice: dispatchSetGasPrice,
    showGasButtonGroup: dispatchShowGasButtonGroup,
    resetCustomData: dispatchResetCustomData,
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
    resetGasButtons: () => {
      dispatchResetCustomData()
      dispatchSetGasPrice(gasButtonInfo[1].priceInHexWei)
      dispatchShowGasButtonGroup()
    },
  }
}
