import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { useDispatch, useSelector } from 'react-redux';
import { useGasFeeInputs } from '../../../hooks/useGasFeeInputs';

import { decimalToHex } from '../../../helpers/utils/conversions.util';

import Popover from '../../ui/popover';
import Button from '../../ui/button';
import EditGasDisplay from '../edit-gas-display';
import EditGasDisplayEducation from '../edit-gas-display-education';

import { I18nContext } from '../../../contexts/i18n';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  hideModal,
  hideSidebar,
  updateTransaction,
} from '../../../store/actions';

export const EDIT_GAS_MODE = {
  SPEED_UP: 'speed-up',
  CANCEL: 'cancel',
  MODIFY_IN_PLACE: 'modify-in-place',
};

export default function EditGasPopover({
  popoverTitle = '',
  confirmButtonText = '',
  editGasDisplayProps = {},
  defaultEstimateToUse = 'medium',
  transaction,
  mode,
  onClose,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const showSidebar = useSelector((state) => state.appState.sidebar.isOpen);

  const showEducationButton = mode === EDIT_GAS_MODE.MODIFY_IN_PLACE;
  const [showEducationContent, setShowEducationContent] = useState(false);

  const [warning] = useState(null);

  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [
    dappSuggestedGasFeeAcknowledged,
    setDappSuggestedGasFeeAcknowledged,
  ] = useState(false);

  const {
    maxPriorityFeePerGas,
    setMaxPriorityFeePerGas,
    maxPriorityFeePerGasFiat,
    maxFeePerGas,
    setMaxFeePerGas,
    maxFeePerGasFiat,
    estimatedMaximumNative,
    isGasEstimatesLoading,
    gasFeeEstimates,
    gasEstimateType,
    gasPrice,
    setGasPrice,
    gasLimit,
    setGasLimit,
    estimateToUse,
    setEstimateToUse,
    estimatedMinimumFiat,
    estimatedMaximumFiat,
    isMaxFeeError,
    isMaxPriorityFeeError,
    isGasTooLow,
  } = useGasFeeInputs(defaultEstimateToUse);

  /**
   * Temporary placeholder, this should be managed by the parent component but
   * we will be extracting this component from the hard to maintain modal/
   * sidebar component. For now this is just to be able to appropriately close
   * the modal in testing
   */
  const closePopover = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (showSidebar) {
      dispatch(hideSidebar());
    } else {
      dispatch(hideModal());
    }
  }, [showSidebar, onClose, dispatch]);

  const onSubmit = useCallback(() => {
    if (!transaction || !mode) {
      closePopover();
    }

    const cancelSpeedUpGas = process.env.SHOW_EIP_1559_UI
      ? {
          gasLimit: decimalToHex(gasLimit),
          maxFeePerGas: decimalToHex(maxFeePerGas),
          maxPriorityFeePerGas: decimalToHex(maxPriorityFeePerGas),
        }
      : {
          gasLimit: decimalToHex(gasLimit),
          gasPrice: decimalToHex(gasPrice),
        };

    switch (mode) {
      case EDIT_GAS_MODE.CANCEL:
        dispatch(createCancelTransaction(transaction.id, cancelSpeedUpGas));
        break;
      case EDIT_GAS_MODE.SPEED_UP:
        dispatch(createSpeedUpTransaction(transaction.id, cancelSpeedUpGas));
        break;
      case EDIT_GAS_MODE.MODIFY_IN_PLACE:
        dispatch(
          updateTransaction({
            ...transaction,
            txParams: {
              ...transaction.txParams,
              ...(process.env.SHOW_EIP_1559_UI
                ? {
                    gas: decimalToHex(gasLimit),
                    maxFeePerGas: decimalToHex(maxFeePerGas),
                    maxPriorityFeePerGas: decimalToHex(maxPriorityFeePerGas),
                  }
                : {
                    gas: decimalToHex(gasLimit),
                    gasPrice: decimalToHex(gasPrice),
                  }),
            },
          }),
        );
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
  ]);

  const title = showEducationContent
    ? t('editGasEducationModalTitle')
    : popoverTitle || t('editGasTitle');
  const footerButtonText = confirmButtonText || t('save');

  return (
    <Popover
      title={title}
      onClose={closePopover}
      onBack={
        showEducationContent ? () => setShowEducationContent(false) : undefined
      }
      footer={
        <>
          <Button
            type="primary"
            onClick={onSubmit}
            disabled={isMaxFeeError || isMaxPriorityFeeError || isGasTooLow}
          >
            {footerButtonText}
          </Button>
        </>
      }
    >
      <div style={{ padding: '0 20px 20px 20px' }}>
        {showEducationContent ? (
          <EditGasDisplayEducation />
        ) : (
          <EditGasDisplay
            showEducationButton={showEducationButton}
            warning={warning}
            showAdvancedForm={showAdvancedForm}
            setShowAdvancedForm={setShowAdvancedForm}
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
            isGasEstimatesLoading={isGasEstimatesLoading}
            gasFeeEstimates={gasFeeEstimates}
            gasEstimateType={gasEstimateType}
            gasPrice={gasPrice}
            setGasPrice={setGasPrice}
            gasLimit={gasLimit}
            setGasLimit={setGasLimit}
            estimateToUse={estimateToUse}
            setEstimateToUse={setEstimateToUse}
            estimatedMinimumFiat={estimatedMinimumFiat}
            estimatedMaximumFiat={estimatedMaximumFiat}
            isMaxFeeError={isMaxFeeError}
            isMaxPriorityFeeError={isMaxPriorityFeeError}
            isGasTooLow={isGasTooLow}
            onEducationClick={() => setShowEducationContent(true)}
            {...editGasDisplayProps}
          />
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
  mode: PropTypes.oneOf(Object.values(EDIT_GAS_MODE)),
  defaultEstimateToUse: PropTypes.string,
};
