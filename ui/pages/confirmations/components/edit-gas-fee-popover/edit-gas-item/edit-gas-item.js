import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../../shared/constants/gas';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { PRIORITY_LEVEL_ICON_MAP } from '../../../../../helpers/constants/gas';
///: END:ONLY_INCLUDE_IF
import { PRIMARY } from '../../../../../helpers/constants/common';
import { toHumanReadableTime } from '../../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionEventFragment } from '../../../hooks/useTransactionEventFragment';
import { useTransactionModalContext } from '../../../../../contexts/transaction-modal';
import InfoTooltip from '../../../../../components/ui/info-tooltip';
import LoadingHeartBeat from '../../../../../components/ui/loading-heartbeat';
import UserPreferencedCurrencyDisplay from '../../../../../components/app/user-preferenced-currency-display';
import EditGasToolTip from '../edit-gas-tooltip/edit-gas-tooltip';

import { useGasItemFeeDetails } from './useGasItemFeeDetails';

const getTitleAndIcon = (priorityLevel, editGasMode) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  let icon = priorityLevel;
  ///: END:ONLY_INCLUDE_IF
  let title = priorityLevel;
  if (priorityLevel === PriorityLevels.dAppSuggested) {
    title = 'dappSuggestedShortLabel';
  } else if (priorityLevel === PriorityLevels.dappSuggestedHigh) {
    title = 'dappSuggestedHighShortLabel';
  } else if (priorityLevel === PriorityLevels.tenPercentIncreased) {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    icon = null;
    ///: END:ONLY_INCLUDE_IF
    title = 'tenPercentIncreased';
  } else if (
    priorityLevel === PriorityLevels.high &&
    editGasMode === EditGasModes.swaps
  ) {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    icon = 'swapSuggested';
    ///: END:ONLY_INCLUDE_IF
    title = 'swapSuggested';
  }
  return {
    title,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    icon,
    ///: END:ONLY_INCLUDE_IF
  };
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
    priorityLevel === PriorityLevels.dAppSuggested &&
    !dappSuggestedGasFees?.maxFeePerGas &&
    !dappSuggestedGasFees?.gasPrice
  ) {
    return null;
  }

  const onOptionSelect = () => {
    if (priorityLevel === PriorityLevels.custom) {
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

      if (priorityLevel === PriorityLevels.tenPercentIncreased) {
        updateTransactionToTenPercentIncreasedGasFee();
      } else if (priorityLevel === PriorityLevels.dAppSuggested) {
        updateTransactionUsingDAPPSuggestedValues();
      } else {
        updateTransactionUsingEstimate(priorityLevel);
      }
    }
  };

  const {
    title,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    icon,
    ///: END:ONLY_INCLUDE_IF
  } = getTitleAndIcon(priorityLevel, editGasMode);

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
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
          icon && (
            <span
              className={`edit-gas-item__icon edit-gas-item__icon-${priorityLevel}`}
            >
              {PRIORITY_LEVEL_ICON_MAP[icon]}
            </span>
          )
          ///: END:ONLY_INCLUDE_IF
        }
        {t(title)}
      </span>
      <span
        className={`edit-gas-item__time-estimate edit-gas-item__time-estimate-${priorityLevel}`}
      >
        {editGasMode !== EditGasModes.swaps &&
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
