import { connect } from 'react-redux';
import {
  getAdvancedInlineGasShown,
  getBasicGasEstimateLoadingStatus,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
  getIsMainnet,
  getIsEthGasPriceFetched,
  getNoGasPriceFetched,
} from '../../../../selectors';
import {
  getGasTotal,
  getGasPrice,
  getGasLimit,
  gasFeeIsInError,
  getGasButtonGroupShown,
  updateGasPrice,
  updateGasLimit,
  useBasicGasEstimation,
  isSendStateInitialized,
  getIsBalanceInsufficient,
  getMinimumGasLimitForSend,
} from '../../../../ducks/send';
import {
  resetCustomData,
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../../ducks/gas/gas.duck';
import { showModal } from '../../../../store/actions';
import { hexToDecimal } from '../../../../helpers/utils/conversions.util';
import SendGasRow from './send-gas-row.component';

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SendGasRow);

function mapStateToProps(state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state);
  const gasPrice = getGasPrice(state);
  const gasLimit = getGasLimit(state);
  const activeButtonIndex = getDefaultActiveButtonIndex(
    gasButtonInfo,
    gasPrice,
  );

  const gasTotal = getGasTotal(state);

  const isEthGasPrice = getIsEthGasPriceFetched(state);
  const noGasPrice = getNoGasPriceFetched(state);

  const minimumGasLimit = getMinimumGasLimitForSend(state);

  return {
    gasTotal,
    minimumGasLimit: hexToDecimal(minimumGasLimit),
    gasFeeError: gasFeeIsInError(state),
    gasLoadingError: isSendStateInitialized(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading: getBasicGasEstimateLoadingStatus(state),
      defaultActiveButtonIndex: 1,
      newActiveButtonIndex: activeButtonIndex > -1 ? activeButtonIndex : null,
      gasButtonInfo,
    },
    gasButtonGroupShown: getGasButtonGroupShown(state),
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    gasPrice,
    gasLimit,
    insufficientBalance: getIsBalanceInsufficient(state),
    isMainnet: getIsMainnet(state),
    isEthGasPrice,
    noGasPrice,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showCustomizeGasModal: () =>
      dispatch(showModal({ name: 'CUSTOMIZE_GAS', hideBasic: true })),
    updateGasPrice: (gasPrice) => {
      dispatch(updateGasPrice(gasPrice));
      dispatch(setCustomGasPrice(gasPrice));
    },
    updateGasLimit: (newLimit) => {
      dispatch(updateGasLimit(newLimit));
      dispatch(setCustomGasLimit(newLimit));
    },
    useBasicGasEstimation: () => dispatch(useBasicGasEstimation()),
    resetCustomData: () => dispatch(resetCustomData()),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { gasPriceButtonGroupProps } = stateProps;
  const { gasButtonInfo } = gasPriceButtonGroupProps;
  const {
    updateGasPrice: dispatchUpdateGasPrice,
    useBasicGasEstimation: dispatchUseBasicGasEstimation,
    resetCustomData: dispatchResetCustomData,
    ...otherDispatchProps
  } = dispatchProps;

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: ({ gasPrice }) =>
        dispatchUpdateGasPrice(gasPrice),
    },
    resetGasButtons: () => {
      dispatchResetCustomData();
      dispatchUpdateGasPrice(gasButtonInfo[1].priceInHexWei);
      dispatchUseBasicGasEstimation();
    },
    updateGasPrice: dispatchUpdateGasPrice,
  };
}
