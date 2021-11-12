import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getMaximumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';
import { GAS_ESTIMATE } from '../../../../../shared/constants/gas';
import { GasLevelIconMap } from '../../../../helpers/constants/gas';
import { PRIMARY } from '../../../../helpers/constants/common';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../../../helpers/utils/conversions.util';
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
  const { waitTimeEstimate } = useCustomTimeEstimate({
    dappSuggestedGasFees,
    estimateType,
    estimateUsed,
    gasFeeEstimates,
    maxFeePerGasValue,
    maxPriorityFeePerGasValue,
  });

  let maxFeePerGas;
  let minWaitTime;

  if (gasFeeEstimates[estimateType]) {
    const { minWaitTimeEstimate, suggestedMaxFeePerGas } = gasFeeEstimates[
      estimateType
    ];
    maxFeePerGas = decGWEIToHexWEI(suggestedMaxFeePerGas);
    minWaitTime =
      estimateType === GAS_ESTIMATE.HIGH
        ? minWaitTimeEstimate
        : gasFeeEstimates?.low.maxWaitTimeEstimate;
  } else if (
    estimateType === GAS_ESTIMATE.DAPP_SUGGESTED &&
    dappSuggestedGasFees
  ) {
    maxFeePerGas = dappSuggestedGasFees.maxFeePerGas;
    minWaitTime = waitTimeEstimate;
  } else if (
    estimateType === GAS_ESTIMATE.CUSTOM &&
    estimateUsed === GAS_ESTIMATE.CUSTOM
  ) {
    // todo: we should show default custom setting for user if available
    // after PR is merged: https://github.com/MetaMask/metamask-extension/pull/12577/files
    maxFeePerGas = decGWEIToHexWEI(customMaxFeePerGas);
    minWaitTime = waitTimeEstimate;
  }

  const hexMaximumTransactionFee = maxFeePerGas
    ? getMaximumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        maxFeePerGas,
      })
    : null;

  const onOptionSelect = () => {
    if (estimateType !== GAS_ESTIMATE.CUSTOM) {
      updateTransactionUsingGasFeeEstimates(estimateType);
    }
    // todo: open advance modal if edtimateType is custom
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
