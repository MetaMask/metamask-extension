import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useGasFeeInputs } from '../../../hooks/gasFeeInput/useGasFeeInputs';
import { txParamsAreDappSuggested } from '../../../../shared/modules/transaction.utils';
import {
  EDIT_GAS_MODES,
  GAS_LIMITS,
  CUSTOM_GAS_ESTIMATE,
  GAS_RECOMMENDATIONS,
} from '../../../../shared/constants/gas';

import Popover from '../../ui/popover';
import Button from '../../ui/button';
import EditGasDisplay from '../edit-gas-display';

import { I18nContext } from '../../../contexts/i18n';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  hideModal,
  updateTransactionGasFees,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../../store/actions';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import { useIncrementedGasFees } from '../../../hooks/useIncrementedGasFees';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexToDecimal,
} from '../../../../shared/modules/conversion.utils';

export default function EditGasPopover({
  popoverTitle = '',
  confirmButtonText = '',
  editGasDisplayProps = {},
  transaction,
  mode,
  onClose,
  minimumGasLimit = GAS_LIMITS.SIMPLE,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const [dappSuggestedGasFeeAcknowledged, setDappSuggestedGasFeeAcknowledged] =
    useState(false);

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
    estimatedMinimumNative,
    gasPrice,
    setGasPrice,
    gasLimit,
    setGasLimit,
    properGasLimit,
    estimateToUse,
    hasGasErrors,
    gasErrors,
    onManualChange,
    balanceError,
  } = useGasFeeInputs(
    GAS_RECOMMENDATIONS.MEDIUM,
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
      estimateUsed: estimateToUse,
      gasPrice: decGWEIToHexWEI(gasPrice),
    };

    const cleanTransactionParams = { ...updatedTransaction.txParams };

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
          createCancelTransaction(updatedTransaction.id, newGasSettings),
        );
        break;
      case EDIT_GAS_MODES.SPEED_UP:
        dispatch(
          createSpeedUpTransaction(updatedTransaction.id, newGasSettings),
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
    estimateToUse,
  ]);

  let title = t('editGasTitle');
  if (popoverTitle) {
    title = popoverTitle;
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
      footer={
        <Button
          type="primary"
          onClick={onSubmit}
          disabled={hasGasErrors || balanceError || !txParamsHaveBeenCustomized}
        >
          {footerButtonText}
        </Button>
      }
    >
      <div style={{ padding: '0 20px 20px 20px', position: 'relative' }}>
        {process.env.IN_TEST ? null : <LoadingHeartBeat />}
        <EditGasDisplay
          dappSuggestedGasFeeAcknowledged={dappSuggestedGasFeeAcknowledged}
          setDappSuggestedGasFeeAcknowledged={
            setDappSuggestedGasFeeAcknowledged
          }
          estimatedMinimumNative={estimatedMinimumNative}
          gasPrice={gasPrice}
          setGasPrice={setGasPrice}
          gasLimit={gasLimit}
          setGasLimit={setGasLimit}
          properGasLimit={properGasLimit}
          mode={mode}
          transaction={updatedTransaction}
          onManualChange={onManualChange}
          minimumGasLimit={minimumGasLimitDec}
          balanceError={balanceError}
          txParamsHaveBeenCustomized={txParamsHaveBeenCustomized}
          gasErrors={gasErrors}
          {...editGasDisplayProps}
        />
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
  minimumGasLimit: PropTypes.string,
};
