import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { getMaximumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';
import { GAS_ESTIMATE } from '../../../../../shared/constants/gas';
import { GasLevelIconMap } from '../../../../helpers/constants/gas';
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
import I18nValue from '../../../ui/i18n-value';
import InfoTooltip from '../../../ui/info-tooltip';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';

import { useCustomTimeEstimate } from './useCustomTimeEstimate';

const EditGasItem = ({ estimateType, onClose }) => {
  const {
    estimateUsed,
    gasFeeEstimates,
    gasLimit,
    maxFeePerGas: maxFeePerGasValue,
    maxPriorityFeePerGas: maxPriorityFeePerGasValue,
    updateTransactionUsingGasFeeEstimates,
    transaction: { dappSuggestedGasFees },
  } = useGasFeeContext();
  const t = useI18nContext();
  const advanecGasFeeDefault = useSelector(getAdvancedGasFeeValues);
  let maxFeePerGas;
  let maxPriorityFeePerGas;
  let minWaitTime;

  if (gasFeeEstimates[estimateType]) {
    maxFeePerGas = gasFeeEstimates[estimateType].suggestedMaxFeePerGas;
  } else if (
    estimateType === GAS_ESTIMATE.DAPP_SUGGESTED &&
    dappSuggestedGasFees
  ) {
    maxFeePerGas = hexWEIToDecGWEI(dappSuggestedGasFees.maxFeePerGas);
    maxPriorityFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxPriorityFeePerGas,
    );
  } else if (estimateType === GAS_ESTIMATE.CUSTOM) {
    if (estimateUsed === GAS_ESTIMATE.CUSTOM) {
      maxFeePerGas = maxFeePerGasValue;
      maxPriorityFeePerGas = maxPriorityFeePerGasValue;
    } else if (advanecGasFeeDefault) {
      maxFeePerGas =
        gasFeeEstimates.estimatedBaseFee *
        parseFloat(advanecGasFeeDefault.maxBaseFee);
      maxPriorityFeePerGas = advanecGasFeeDefault.priorityFee;
    }
  }

  const { waitTimeEstimate } = useCustomTimeEstimate({
    gasFeeEstimates,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  if (gasFeeEstimates[estimateType]) {
    minWaitTime =
      estimateType === GAS_ESTIMATE.HIGH
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
    if (estimateType !== GAS_ESTIMATE.CUSTOM) {
      updateTransactionUsingGasFeeEstimates(estimateType);
    }
    // todo: open advance modal if estimateType is custom
    onClose();
  };

  return (
    <div
      className={classNames('edit-gas-item', {
        [`edit-gas-item-selected`]: estimateType === estimateUsed,
        [`edit-gas-item-disabled`]:
          estimateType === GAS_ESTIMATE.DAPP_SUGGESTED && !dappSuggestedGasFees,
      })}
      role="button"
      onClick={onOptionSelect}
    >
      <span className="edit-gas-item__name">
        <span
          className={`edit-gas-item__icon edit-gas-item__icon-${estimateType}`}
        >
          {GasLevelIconMap[estimateType]}
        </span>
        <I18nValue
          messageKey={
            estimateType === GAS_ESTIMATE.DAPP_SUGGESTED
              ? 'dappSuggestedShortLabel'
              : estimateType
          }
        />
      </span>
      <span
        className={`edit-gas-item__time-estimate edit-gas-item__time-estimate-${estimateType}`}
      >
        {minWaitTime
          ? minWaitTime && toHumanReadableTime(minWaitTime, t)
          : '--'}
      </span>
      <span
        className={`edit-gas-item__fee-estimate edit-gas-item__fee-estimate-${estimateType}`}
      >
        {hexMaximumTransactionFee ? (
          <UserPreferencedCurrencyDisplay
            key="editGasSubTextFeeAmount"
            type={PRIMARY}
            value={hexMaximumTransactionFee}
          />
        ) : (
          '--'
        )}
      </span>
      <span className="edit-gas-item__tooltip">
        <InfoTooltip position="top" />
      </span>
    </div>
  );
};

EditGasItem.propTypes = {
  estimateType: PropTypes.string,
  onClose: PropTypes.func,
};

export default EditGasItem;
