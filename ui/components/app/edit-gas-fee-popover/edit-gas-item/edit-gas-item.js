import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import classNames from 'classnames';

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
import { hexWEIToDecGWEI } from '../../../../helpers/utils/conversions.util';
import {
  bnGreaterThan,
  toHumanReadableTime,
} from '../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';

import Box from '../../../ui/box';
import InfoTooltip from '../../../ui/info-tooltip';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';
import EditGasToolTip from '../edit-gas-tooltip/edit-gas-tooltip';
import { useGasItemFeeDetails } from './useGasItemFeeDetails';

const EditGasItem = ({ priorityLevel }) => {
  const {
    editGasMode,
    estimateUsed,
    gasFeeEstimates,
    gasLimit,
    updateTransactionUsingDAPPSuggestedValues,
    updateTransactionUsingEstimate,
    transaction,
  } = useGasFeeContext();
  const t = useI18nContext();
  const { closeModal, openModal } = useTransactionModalContext();
  const [disabled, setDisabled] = useState(false);
  const { dappSuggestedGasFees } = transaction;

  const {
    maxFeePerGas,
    maxPriorityFeePerGas,
    minWaitTime,
    hexMaximumTransactionFee,
  } = useGasItemFeeDetails(priorityLevel);

  const onOptionSelect = () => {
    if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
      openModal('advancedGasFee');
    } else {
      closeModal('editGasFee');
      if (priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED) {
        updateTransactionUsingDAPPSuggestedValues();
      } else {
        updateTransactionUsingEstimate(priorityLevel);
      }
    }
  };

  // For cancel and sepped-up medium option is disabled if
  // gas used in transaction + 10% is greater tham medium estimate
  if (
    (editGasMode === EDIT_GAS_MODES.CANCEL ||
      editGasMode === EDIT_GAS_MODES.SPEED_UP) &&
    priorityLevel === PRIORITY_LEVELS.MEDIUM
  ) {
    let { maxFeePerGas: maxFeePerGasInTransaction } = transaction.txParams;
    maxFeePerGasInTransaction = new BigNumber(
      hexWEIToDecGWEI(maxFeePerGasInTransaction),
    ).times(1.1);
    const maxFeePerGasMedium = gasFeeEstimates.medium?.suggestedMaxFeePerGas;
    if (bnGreaterThan(maxFeePerGasInTransaction, maxFeePerGasMedium)) {
      setDisabled(true);
    }
  }

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
  } else if (priorityLevel === PRIORITY_LEVELS.MINIMUM) {
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
        'edit-gas-item--selected': priorityLevel === estimateUsed,
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
          <div className="edit-gas-item__maxfee">
            <LoadingHeartBeat />
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
  priorityLevel: PropTypes.string,
};

export default EditGasItem;
