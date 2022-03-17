import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useGasFeeInputs } from '../../../hooks/gasFeeInput/useGasFeeInputs';
import { getGasLoadingAnimationIsShowing } from '../../../ducks/app/app';
import { txParamsAreDappSuggested } from '../../../../shared/modules/transaction.utils';
import {
  EDIT_GAS_MODES,
  GAS_LIMITS,
  GAS_RECOMMENDATIONS,
  CUSTOM_GAS_ESTIMATE,
} from '../../../../shared/constants/gas';

import {
  decGWEIToHexWEI,
  decimalToHex,
  hexToDecimal,
} from '../../../helpers/utils/conversions.util';

import Popover from '../../ui/popover';
import Button from '../../ui/button';
import EditGasDisplay from '../edit-gas-display';
import EditGasDisplayEducation from '../edit-gas-display-education';

import { I18nContext } from '../../../contexts/i18n';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  hideModal,
  updateTransactionGasFees,
  updateCustomSwapsEIP1559GasParams,
  updateSwapsUserFeeLevel,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../../store/actions';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import { useIncrementedGasFees } from '../../../hooks/useIncrementedGasFees';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';

export default function EditGasPopover({
  popoverTitle = '',
  confirmButtonText = '',
  editGasDisplayProps = {},
  defaultEstimateToUse = GAS_RECOMMENDATIONS.MEDIUM,
  transaction,
  mode,
  onClose,
  minimumGasLimit = GAS_LIMITS.SIMPLE,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);
  const gasLoadingAnimationIsShowing = useSelector(
    getGasLoadingAnimationIsShowing,
  );

  const showEducationButton =
    (mode === EDIT_GAS_MODES.MODIFY_IN_PLACE ||
      mode === EDIT_GAS_MODES.SWAPS) &&
    supportsEIP1559;
  const [showEducationContent, setShowEducationContent] = useState(false);

  const [
    dappSuggestedGasFeeAcknowledged,
    setDappSuggestedGasFeeAcknowledged,
  ] = useState(false);

  const minimumGasLimitDec = hexToDecimal(minimumGasLimit);
  const updatedCustomGasSettings = useIncrementedGasFees(transaction);

  let updatedTransaction = transaction;
  if (mode === EDIT_GAS_MODES.SPEED_UP || mode === EDIT_GAS_MODES.CANCEL) {
    updatedTransaction = {
      ...transaction,
      userFeeLevel: CUSTOM_GAS_ESTIMATE,
      txParams: {
        ...transaction.txParams,
        ...updatedCustomGasSettings,
      },
    };
  }

  const {
    maxPriorityFeePerGas,
    setMaxPriorityFeePerGas,
    maxPriorityFeePerGasFiat,
    maxFeePerGas,
    setMaxFeePerGas,
    maxFeePerGasFiat,
    estimatedMaximumNative,
    estimatedMinimumNative,
    isGasEstimatesLoading,
    gasEstimateType,
    gasPrice,
    setGasPrice,
    gasLimit,
    setGasLimit,
    properGasLimit,
    estimateToUse,
    setEstimateToUse,
    estimatedMinimumFiat,
    estimatedMaximumFiat,
    hasGasErrors,
    gasErrors,
    gasWarnings,
    onManualChange,
    balanceError,
    estimatesUnavailableWarning,
    estimatedBaseFee,
    isNetworkBusy,
  } = useGasFeeInputs(
    defaultEstimateToUse,
    updatedTransaction,
    minimumGasLimit,
    mode,
  );

  const txParamsHaveBeenCustomized =
    estimateToUse === CUSTOM_GAS_ESTIMATE ||
    txParamsAreDappSuggested(updatedTransaction);

  /**
   * Temporary placeholder, this should be managed by the parent component but
   * we will be extracting this component from the hard to maintain modal
   * component. For now this is just to be able to appropriately close
   * the modal in testing
   */
  const closePopover = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      dispatch(hideModal());
    }
  }, [onClose, dispatch]);

  const onSubmit = useCallback(async () => {
    if (!updatedTransaction || !mode) {
      closePopover();
    }

    const newGasSettings = {
      gas: decimalToHex(gasLimit),
      gasLimit: decimalToHex(gasLimit),
      estimateSuggested: defaultEstimateToUse,
      estimateUsed: estimateToUse,
    };

    if (supportsEIP1559) {
      newGasSettings.maxFeePerGas = decGWEIToHexWEI(maxFeePerGas ?? gasPrice);
      newGasSettings.maxPriorityFeePerGas = decGWEIToHexWEI(
        maxPriorityFeePerGas ?? maxFeePerGas ?? gasPrice,
      );
    } else {
      newGasSettings.gasPrice = decGWEIToHexWEI(gasPrice);
    }

    const cleanTransactionParams = { ...updatedTransaction.txParams };

    if (supportsEIP1559) {
      delete cleanTransactionParams.gasPrice;
    }

    const updatedTxMeta = {
      ...updatedTransaction,
      userEditedGasLimit: gasLimit !== Number(transaction.originalGasEstimate),
      userFeeLevel: estimateToUse || CUSTOM_GAS_ESTIMATE,
      txParams: {
        ...cleanTransactionParams,
        ...newGasSettings,
      },
    };

    switch (mode) {
      case EDIT_GAS_MODES.CANCEL:
        dispatch(
          createCancelTransaction(updatedTransaction.id, newGasSettings, {
            estimatedBaseFee,
          }),
        );
        break;
      case EDIT_GAS_MODES.SPEED_UP:
        dispatch(
          createSpeedUpTransaction(updatedTransaction.id, newGasSettings, {
            estimatedBaseFee,
          }),
        );
        break;
      case EDIT_GAS_MODES.MODIFY_IN_PLACE:
        newGasSettings.userEditedGasLimit = updatedTxMeta.userEditedGasLimit;
        newGasSettings.userFeeLevel = updatedTxMeta.userFeeLevel;

        dispatch(showLoadingIndication());
        await dispatch(
          updateTransactionGasFees(updatedTxMeta.id, newGasSettings),
        );
        dispatch(hideLoadingIndication());
        break;
      case EDIT_GAS_MODES.SWAPS:
        // This popover component should only be used for the "FEE_MARKET" type in Swaps.
        if (supportsEIP1559) {
          dispatch(
            updateSwapsUserFeeLevel(estimateToUse || CUSTOM_GAS_ESTIMATE),
          );
          dispatch(updateCustomSwapsEIP1559GasParams(newGasSettings));
        }
        break;
      default:
        break;
    }

    closePopover();
  }, [
    updatedTransaction,
    mode,
    dispatch,
    closePopover,
    gasLimit,
    gasPrice,
    transaction.originalGasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas,
    supportsEIP1559,
    estimateToUse,
    estimatedBaseFee,
    defaultEstimateToUse,
  ]);

  let title = t('editGasTitle');
  if (popoverTitle) {
    title = popoverTitle;
  } else if (showEducationContent) {
    title = t('editGasEducationModalTitle');
  } else if (mode === EDIT_GAS_MODES.SPEED_UP) {
    title = t('speedUpPopoverTitle');
  } else if (mode === EDIT_GAS_MODES.CANCEL) {
    title = t('cancelPopoverTitle');
  }

  const footerButtonText = confirmButtonText || t('save');
  return (
    <Popover
      title={title}
      onClose={closePopover}
      className="edit-gas-popover__wrapper"
      onBack={
        showEducationContent ? () => setShowEducationContent(false) : undefined
      }
      footer={
        showEducationContent ? null : (
          <>
            <Button
              type="primary"
              onClick={onSubmit}
              disabled={
                hasGasErrors ||
                balanceError ||
                ((isGasEstimatesLoading || gasLoadingAnimationIsShowing) &&
                  !txParamsHaveBeenCustomized)
              }
            >
              {footerButtonText}
            </Button>
          </>
        )
      }
    >
      <div style={{ padding: '0 20px 20px 20px', position: 'relative' }}>
        {showEducationContent ? (
          <EditGasDisplayEducation />
        ) : (
          <>
            {process.env.IN_TEST ? null : <LoadingHeartBeat />}
            <EditGasDisplay
              showEducationButton={showEducationButton}
              dappSuggestedGasFeeAcknowledged={dappSuggestedGasFeeAcknowledged}
              setDappSuggestedGasFeeAcknowledged={
                setDappSuggestedGasFeeAcknowledged
              }
              maxPriorityFeePerGas={maxPriorityFeePerGas}
              setMaxPriorityFeePerGas={setMaxPriorityFeePerGas}
              maxPriorityFeePerGasFiat={maxPriorityFeePerGasFiat}
              maxFeePerGas={maxFeePerGas}
              setMaxFeePerGas={setMaxFeePerGas}
              maxFeePerGasFiat={maxFeePerGasFiat}
              estimatedMaximumNative={estimatedMaximumNative}
              estimatedMinimumNative={estimatedMinimumNative}
              isGasEstimatesLoading={isGasEstimatesLoading}
              gasEstimateType={gasEstimateType}
              gasPrice={gasPrice}
              setGasPrice={setGasPrice}
              gasLimit={gasLimit}
              setGasLimit={setGasLimit}
              properGasLimit={properGasLimit}
              estimateToUse={estimateToUse}
              setEstimateToUse={setEstimateToUse}
              estimatedMinimumFiat={estimatedMinimumFiat}
              estimatedMaximumFiat={estimatedMaximumFiat}
              onEducationClick={() => setShowEducationContent(true)}
              mode={mode}
              transaction={updatedTransaction}
              gasErrors={gasErrors}
              gasWarnings={gasWarnings}
              onManualChange={onManualChange}
              minimumGasLimit={minimumGasLimitDec}
              balanceError={balanceError}
              estimatesUnavailableWarning={estimatesUnavailableWarning}
              hasGasErrors={hasGasErrors}
              txParamsHaveBeenCustomized={txParamsHaveBeenCustomized}
              isNetworkBusy={isNetworkBusy}
              {...editGasDisplayProps}
            />
          </>
        )}
      </div>
    </Popover>
  );
}

EditGasPopover.propTypes = {
  popoverTitle: PropTypes.string,
  editGasDisplayProps: PropTypes.object,
  confirmButtonText: PropTypes.string,
  onClose: PropTypes.func,
  transaction: PropTypes.object,
  mode: PropTypes.oneOf(Object.values(EDIT_GAS_MODES)),
  defaultEstimateToUse: PropTypes.string,
  minimumGasLimit: PropTypes.string,
};
