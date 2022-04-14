import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../../shared/constants/gas';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../../helpers/constants/gas';
import { PRIMARY } from '../../../../helpers/constants/common';
import { toHumanReadableTime } from '../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import I18nValue from '../../../ui/i18n-value';
import InfoTooltip from '../../../ui/info-tooltip';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';
import EditGasToolTip from '../edit-gas-tooltip/edit-gas-tooltip';

import { useGasItemFeeDetails } from './useGasItemFeeDetails';

const getTitleAndIcon = (priorityLevel, editGasMode) => {
  let icon = priorityLevel;
  let title = priorityLevel;
  if (priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED) {
    title = 'dappSuggestedShortLabel';
  } else if (priorityLevel === PRIORITY_LEVELS.TEN_PERCENT_INCREASED) {
    icon = null;
    title = 'tenPercentIncreased';
  } else if (
    priorityLevel === PRIORITY_LEVELS.HIGH &&
    editGasMode === EDIT_GAS_MODES.SWAPS
  ) {
    icon = 'swapSuggested';
    title = 'swapSuggested';
  }
  return { title, icon };
};

const EditGasItem = ({ priorityLevel }) => {
  const {
    editGasMode,
    estimateUsed,
    gasLimit,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingDAPPSuggestedValues,
    updateTransactionUsingEstimate,
    transaction,
  } = useGasFeeContext();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
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
    !dappSuggestedGasFees?.maxFeePerGas &&
    !dappSuggestedGasFees?.gasPrice
  ) {
    return null;
  }

  const onOptionSelect = () => {
    if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
      updateTransactionEventFragment({
        properties: {
          gas_edit_attempted: 'advanced',
        },
      });
      openModal('advancedGasFee');
    } else {
      updateTransactionEventFragment({
        properties: {
          gas_edit_type: 'basic',
        },
      });

      closeModal(['editGasFee']);

      if (priorityLevel === PRIORITY_LEVELS.TEN_PERCENT_INCREASED) {
        updateTransactionToTenPercentIncreasedGasFee();
      } else if (priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED) {
        updateTransactionUsingDAPPSuggestedValues();
      } else {
        updateTransactionUsingEstimate(priorityLevel);
      }
    }
  };

  const { title, icon } = getTitleAndIcon(priorityLevel, editGasMode);

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
      data-testid={`edit-gas-fee-item-${priorityLevel}`}
    >
      <span className="edit-gas-item__name">
        {icon && (
          <span
            className={`edit-gas-item__icon edit-gas-item__icon-${priorityLevel}`}
          >
            {PRIORITY_LEVEL_ICON_MAP[icon]}
          </span>
        )}
        <I18nValue messageKey={title} />
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
            <LoadingHeartBeat
              backgroundColor={
                priorityLevel === estimateUsed
                  ? 'var(--color-background-alternative)'
                  : 'var(--color-background-default)'
              }
              estimateUsed={priorityLevel}
            />
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
