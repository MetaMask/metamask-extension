import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getMaximumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';
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

const EditGasItem = ({ estimateType, onClose }) => {
  const {
    estimateUsed,
    gasFeeEstimates,
    gasLimit,
    setEstimateToUse,
    updateTransaction,
  } = useGasFeeContext();
  const t = useI18nContext();

  const { minWaitTimeEstimate, suggestedMaxFeePerGas } =
    gasFeeEstimates[estimateType] || {};
  const hexMaximumTransactionFee = suggestedMaxFeePerGas
    ? getMaximumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        maxFeePerGas: decGWEIToHexWEI(suggestedMaxFeePerGas),
      })
    : null;

  return (
    <div
      className={classNames('edit-gas-item', {
        [`edit-gas-item-selected`]: estimateType === estimateUsed,
      })}
      role="button"
      onClick={() => {
        setEstimateToUse(estimateType);
        updateTransaction(estimateType);
        onClose();
      }}
    >
      <span className="edit-gas-item__name">
        <span className="edit-gas-item__icon">
          {GasLevelIconMap[estimateType]}
        </span>
        <I18nValue messageKey={estimateType} />
      </span>
      <span
        className={`edit-gas-item__time-estimate edit-gas-item__time-estimate-${estimateType}`}
      >
        {minWaitTimeEstimate && toHumanReadableTime(minWaitTimeEstimate, t)}
      </span>
      <span
        className={`edit-gas-item__fee-estimate edit-gas-item__fee-estimate-${estimateType}`}
      >
        <UserPreferencedCurrencyDisplay
          key="editGasSubTextFeeAmount"
          type={PRIMARY}
          value={hexMaximumTransactionFee}
        />
      </span>
      <span className="edit-gas-item__tooltip">
        <InfoTooltip />
      </span>
    </div>
  );
};

EditGasItem.propTypes = {
  estimateType: PropTypes.string,
  onClose: PropTypes.func,
};

export default EditGasItem;
