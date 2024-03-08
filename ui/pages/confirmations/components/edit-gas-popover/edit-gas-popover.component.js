import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useGasFeeInputs } from '../../hooks/useGasFeeInputs';
import { txParamsAreDappSuggested } from '../../../../../shared/modules/transaction.utils';
import {
  EditGasModes,
  GAS_LIMITS,
  CUSTOM_GAS_ESTIMATE,
  GasRecommendations,
} from '../../../../../shared/constants/gas';

import {
  Modal,
  ModalOverlay,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../../../components/component-library';
import { ModalContent } from '../../../../components/component-library/modal-content/deprecated';
import { ModalHeader } from '../../../../components/component-library/modal-header/deprecated';
import EditGasDisplay from '../edit-gas-display';

import { I18nContext } from '../../../../contexts/i18n';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  hideModal,
  updateTransactionGasFees,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../../../store/actions';
import LoadingHeartBeat from '../../../../components/ui/loading-heartbeat';
import { useIncrementedGasFees } from '../../hooks/useIncrementedGasFees';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexToDecimal,
} from '../../../../../shared/modules/conversion.utils';

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
  if (mode === EditGasModes.speedUp || mode === EditGasModes.cancel) {
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
    GasRecommendations.medium,
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
      case EditGasModes.cancel:
        dispatch(
          createCancelTransaction(updatedTransaction.id, newGasSettings),
        );
        break;
      case EditGasModes.speedUp:
        dispatch(
          createSpeedUpTransaction(updatedTransaction.id, newGasSettings),
        );
        break;
      case EditGasModes.modifyInPlace:
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
  } else if (mode === EditGasModes.speedUp) {
    title = t('speedUpPopoverTitle');
  } else if (mode === EditGasModes.cancel) {
    title = t('cancelPopoverTitle');
  }

  const footerButtonText = confirmButtonText || t('save');
  return (
    <Modal isOpen onClose={closePopover}>
      <ModalOverlay />
      <ModalContent autoFocus={false} className="edit-gas-popover">
        <ModalHeader onClose={closePopover} marginBottom={4}>
          {title}
        </ModalHeader>
        <div className="edit-gas-popover__edit-gas-display">
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
        <Button
          block
          variant={ButtonVariant.Primary}
          size={ButtonSize.LG}
          marginTop={4}
          onClick={onSubmit}
          disabled={hasGasErrors || balanceError || !txParamsHaveBeenCustomized}
        >
          {footerButtonText}
        </Button>
      </ModalContent>
    </Modal>
  );
}

EditGasPopover.propTypes = {
  popoverTitle: PropTypes.string,
  editGasDisplayProps: PropTypes.object,
  confirmButtonText: PropTypes.string,
  onClose: PropTypes.func,
  transaction: PropTypes.object,
  mode: PropTypes.oneOf(Object.values(EditGasModes)),
  minimumGasLimit: PropTypes.string,
};
