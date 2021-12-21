import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

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
import { toHumanReadableTime } from '../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import Box from '../../../ui/box';
import EditGasToolTip from '../edit-gas-tooltip/edit-gas-tooltip';
import InfoTooltip from '../../../ui/info-tooltip';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';

import { useGasItemFeeDetails } from './useGasItemFeeDetails';

const getTitleAndIcon = (priorityLevel, t, editGasMode) => {
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
  return { title, icon };
};

const EditGasItem = ({ priorityLevel }) => {
  const {
    editGasMode,
    estimateUsed,
    gasLimit,
    updateTransactionToMinimumGasFee,
    updateTransactionUsingDAPPSuggestedValues,
    updateTransactionUsingEstimate,
    transaction,
  } = useGasFeeContext();
  const t = useI18nContext();
  const { closeModal, openModal } = useTransactionModalContext();
  const { dappSuggestedGasFees } = transaction;

  const {
    // for cancel or speedup estimateGreaterThaGasUse is true if previous gas used
    // was more than estimate for the priorityLevel
    estimateGreaterThanGasUse,
    hexMaximumTransactionFee,
    maxFeePerGas,
    maxPriorityFeePerGas,
    minWaitTime,
  } = useGasItemFeeDetails(priorityLevel);

  if (
    priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED &&
    !dappSuggestedGasFees
  ) {
    return null;
  }

  const onOptionSelect = () => {
    if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
      openModal('advancedGasFee');
    } else {
      closeModal('editGasFee');

      if (priorityLevel === PRIORITY_LEVELS.MINIMUM) {
        updateTransactionToMinimumGasFee();
      } else if (priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED) {
        updateTransactionUsingDAPPSuggestedValues();
      } else {
        updateTransactionUsingEstimate(priorityLevel);
      }
    }
  };

  const { title, icon } = getTitleAndIcon(priorityLevel, t, editGasMode);

  return (
    <button
      className={classNames('edit-gas-item', {
        'edit-gas-item--selected': priorityLevel === estimateUsed,
        'edit-gas-item--disabled': estimateGreaterThanGasUse,
      })}
      onClick={onOptionSelect}
      aria-label={priorityLevel}
      autoFocus={priorityLevel === estimateUsed}
      disabled={estimateGreaterThanGasUse}
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
              estimateGreaterThanGasUse={estimateGreaterThanGasUse}
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
