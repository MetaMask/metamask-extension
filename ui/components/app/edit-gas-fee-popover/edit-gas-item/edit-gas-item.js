import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { getMaximumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';
import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../../shared/constants/gas';
import {
  ALIGN_ITEMS,
  DISPLAY,
} from '../../../../helpers/constants/design-system';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../../helpers/constants/gas';
import { PRIMARY } from '../../../../helpers/constants/common';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util';
import { getAdvancedGasFeeValues } from '../../../../selectors';
import { toHumanReadableTime } from '../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';

import Box from '../../../ui/box';
import InfoTooltip from '../../../ui/info-tooltip';
import EditGasToolTip from '../edit-gas-tooltip/edit-gas-tooltip';
import { useCustomTimeEstimate } from './useCustomTimeEstimate';

const EditGasItem = ({ disabled, priorityLevel, estimateIsStale }) => {
  const {
    editGasMode,
    estimateUsed,
    gasFeeEstimates,
    gasLimit,
    maxFeePerGas: maxFeePerGasValue,
    maxPriorityFeePerGas: maxPriorityFeePerGasValue,
    updateTransactionUsingGasFeeEstimates,
    transaction,
  } = useGasFeeContext();
  const t = useI18nContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const { closeModal, openModal } = useTransactionModalContext();
  const { dappSuggestedGasFees } = transaction;

  let maxFeePerGas;
  let maxPriorityFeePerGas;
  let minWaitTime;

  if (gasFeeEstimates?.[priorityLevel]) {
    maxFeePerGas = gasFeeEstimates[priorityLevel]?.suggestedMaxFeePerGas;
  } else if (
    priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED &&
    dappSuggestedGasFees
  ) {
    maxFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxFeePerGas || dappSuggestedGasFees.gasPrice,
    );
    maxPriorityFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxPriorityFeePerGas || maxFeePerGas,
    );
  } else if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
    if (estimateUsed === PRIORITY_LEVELS.CUSTOM) {
      maxFeePerGas = maxFeePerGasValue;
      maxPriorityFeePerGas = maxPriorityFeePerGasValue;
    } else if (advancedGasFeeValues) {
      maxFeePerGas =
        gasFeeEstimates.estimatedBaseFee *
        parseFloat(advancedGasFeeValues.maxBaseFee);
      maxPriorityFeePerGas = advancedGasFeeValues.priorityFee;
    }
  }

  const { waitTimeEstimate } = useCustomTimeEstimate({
    gasFeeEstimates,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  if (gasFeeEstimates[priorityLevel]) {
    minWaitTime =
      priorityLevel === PRIORITY_LEVELS.HIGH
        ? gasFeeEstimates?.high.minWaitTimeEstimate
        : gasFeeEstimates?.low.maxWaitTimeEstimate;
  } else {
    minWaitTime = waitTimeEstimate;
  }

  const hexMaximumTransactionFee = maxFeePerGas
    ? getMaximumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        maxFeePerGas: decGWEIToHexWEI(maxFeePerGas),
      })
    : null;

  const onOptionSelect = () => {
    if (disabled) return;
    if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
      openModal('advancedGasFee');
    } else {
      updateTransactionUsingGasFeeEstimates(priorityLevel);
      closeModal('editGasFee');
    }
  };

  if (
    priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED &&
    !dappSuggestedGasFees
  ) {
    return null;
  }

  let icon = priorityLevel;
  let title = t(priorityLevel);
  if (priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED) {
    title = t('dappSuggestedShortLabel');
  } else if (
    priorityLevel === PRIORITY_LEVELS.LOW &&
    (editGasMode === EDIT_GAS_MODES.CANCEL ||
      editGasMode === EDIT_GAS_MODES.SPEED_UP)
  ) {
    icon = null;
    title = (
      <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        {t('minimumCancelSpeedupGasFee')}
        <span className="edit-gas-item__name__sufix">({t('minimum')})</span>
      </Box>
    );
  } else if (
    priorityLevel === PRIORITY_LEVELS.HIGH &&
    editGasMode === EDIT_GAS_MODES.SWAPS
  ) {
    icon = 'swapSuggested';
    title = t('swapSuggested');
  }

  return (
    <button
      className={classNames('edit-gas-item', {
        'edit-gas-item--selected':
          !estimateIsStale && priorityLevel === estimateUsed,
        'edit-gas-item--disabled': disabled,
      })}
      onClick={onOptionSelect}
      aria-label={priorityLevel}
      autoFocus={priorityLevel === estimateUsed}
      disabled={disabled}
    >
      <span className="edit-gas-item__name">
        {icon && (
          <span
            className={`edit-gas-item__icon edit-gas-item__icon-${priorityLevel}`}
          >
            {PRIORITY_LEVEL_ICON_MAP[icon]}
          </span>
        )}
        {title}
      </span>
      <span
        className={`edit-gas-item__time-estimate edit-gas-item__time-estimate-${priorityLevel}`}
      >
        {editGasMode !== EDIT_GAS_MODES.SWAPS &&
          (minWaitTime ? toHumanReadableTime(t, minWaitTime) : '--')}
      </span>
      <span
        className={`edit-gas-item__fee-estimate edit-gas-item__fee-estimate-${priorityLevel}`}
      >
        {hexMaximumTransactionFee ? (
          <div>
            <UserPreferencedCurrencyDisplay
              key="editGasSubTextFeeAmount"
              type={PRIMARY}
              value={hexMaximumTransactionFee}
            />
          </div>
        ) : (
          '--'
        )}
      </span>
      <span className="edit-gas-item__tooltip" data-testid="gas-tooltip">
        <InfoTooltip
          contentText={
            <EditGasToolTip
              t={t}
              priorityLevel={priorityLevel}
              maxFeePerGas={maxFeePerGas}
              maxPriorityFeePerGas={maxPriorityFeePerGas}
              editGasMode={editGasMode}
              gasLimit={gasLimit}
              transaction={transaction}
            />
          }
          position="top"
        />
      </span>
    </button>
  );
};

EditGasItem.propTypes = {
  disabled: PropTypes.bool,
  priorityLevel: PropTypes.string,
  estimateIsStale: PropTypes.bool,
};

export default EditGasItem;
