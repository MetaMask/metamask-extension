import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useGasFeeInputs } from '../../../hooks/useGasFeeInputs';
import { getGasLoadingAnimationIsShowing } from '../../../ducks/app/app';
import { txParamsAreDappSuggested } from '../../../../shared/modules/transaction.utils';
import { EDIT_GAS_MODES, GAS_LIMITS } from '../../../../shared/constants/gas';

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
  updateTransaction,
  updateCustomSwapsEIP1559GasParams,
  updateSwapsUserFeeLevel,
} from '../../../store/actions';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import { checkNetworkAndAccountSupports1559 } from '../../../selectors';

export default function EditGasPopover({
  popoverTitle = '',
  confirmButtonText = '',
  editGasDisplayProps = {},
  defaultEstimateToUse = 'medium',
  transaction,
  mode,
  onClose,
  minimumGasLimit = GAS_LIMITS.SIMPLE,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const networkAndAccountSupport1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const gasLoadingAnimationIsShowing = useSelector(
    getGasLoadingAnimationIsShowing,
  );

  const showEducationButton =
    (mode === EDIT_GAS_MODES.MODIFY_IN_PLACE ||
      mode === EDIT_GAS_MODES.SWAPS) &&
    networkAndAccountSupport1559;
  const [showEducationContent, setShowEducationContent] = useState(false);

  const [warning] = useState(null);

  const [
    dappSuggestedGasFeeAcknowledged,
    setDappSuggestedGasFeeAcknowledged,
  ] = useState(false);

  const minimumGasLimitDec = hexToDecimal(minimumGasLimit);

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
  } = useGasFeeInputs(defaultEstimateToUse, transaction, minimumGasLimit, mode);

  const txParamsHaveBeenCustomized =
    estimateToUse === 'custom' || txParamsAreDappSuggested(transaction);

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

  const onSubmit = useCallback(() => {
    if (!transaction || !mode) {
      closePopover();
    }

    const newGasSettings = networkAndAccountSupport1559
      ? {
          gas: decimalToHex(gasLimit),
          gasLimit: decimalToHex(gasLimit),
          maxFeePerGas: decGWEIToHexWEI(maxFeePerGas ?? gasPrice),
          maxPriorityFeePerGas: decGWEIToHexWEI(
            maxPriorityFeePerGas ?? maxFeePerGas ?? gasPrice,
          ),
        }
      : {
          gas: decimalToHex(gasLimit),
          gasLimit: decimalToHex(gasLimit),
          gasPrice: decGWEIToHexWEI(gasPrice),
        };

    const cleanTransactionParams = { ...transaction.txParams };

    if (networkAndAccountSupport1559) {
      delete cleanTransactionParams.gasPrice;
    }

    const updatedTxMeta = {
      ...transaction,
      userFeeLevel: estimateToUse || 'custom',
      txParams: {
        ...cleanTransactionParams,
        ...newGasSettings,
      },
    };

    switch (mode) {
      case EDIT_GAS_MODES.CANCEL:
        dispatch(
          createCancelTransaction(transaction.id, newGasSettings, {
            estimatedBaseFee,
          }),
        );
        break;
      case EDIT_GAS_MODES.SPEED_UP:
        dispatch(
          createSpeedUpTransaction(transaction.id, newGasSettings, {
            estimatedBaseFee,
          }),
        );
        break;
      case EDIT_GAS_MODES.MODIFY_IN_PLACE:
        dispatch(updateTransaction(updatedTxMeta));
        break;
      case EDIT_GAS_MODES.SWAPS:
        // This popover component should only be used for the "FEE_MARKET" type in Swaps.
        if (networkAndAccountSupport1559) {
          dispatch(updateSwapsUserFeeLevel(estimateToUse || 'custom'));
          dispatch(updateCustomSwapsEIP1559GasParams(newGasSettings));
        }
        break;
      default:
        break;
    }

    closePopover();
  }, [
    transaction,
    mode,
    dispatch,
    closePopover,
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    networkAndAccountSupport1559,
    estimateToUse,
    estimatedBaseFee,
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
            {process.env.IN_TEST === 'true' ? null : <LoadingHeartBeat />}
            <EditGasDisplay
              showEducationButton={showEducationButton}
              warning={warning}
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
              estimateToUse={estimateToUse}
              setEstimateToUse={setEstimateToUse}
              estimatedMinimumFiat={estimatedMinimumFiat}
              estimatedMaximumFiat={estimatedMaximumFiat}
              onEducationClick={() => setShowEducationContent(true)}
              mode={mode}
              transaction={transaction}
              gasErrors={gasErrors}
              gasWarnings={gasWarnings}
              onManualChange={onManualChange}
              minimumGasLimit={minimumGasLimitDec}
              balanceError={balanceError}
              estimatesUnavailableWarning={estimatesUnavailableWarning}
              hasGasErrors={hasGasErrors}
              txParamsHaveBeenCustomized={txParamsHaveBeenCustomized}
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
