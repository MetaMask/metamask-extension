import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { GasLevelIconMap } from '../../../../helpers/constants/gas';
import { PRIMARY } from '../../../../helpers/constants/common';
import { addHexPrefix } from '../../../../../app/scripts/lib/util';
import { decGWEIToHexWEI } from '../../../../helpers/utils/conversions.util';
import { toHumanReadableTime } from '../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import I18nValue from '../../../ui/i18n-value';
import InfoTooltip from '../../../ui/info-tooltip';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';
import { getMinimumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';

const EditGasItem = ({ estimateType }) => {
  const { estimatedMinimumNative, estimateUsed, gasFeeEstimates, setEstimateToUse } = useGasFeeContext();
  const t = useI18nContext()

  const { minWaitTimeEstimate } = gasFeeEstimates[estimateType] || {}

  return (
    <div
      className={classNames('edit-gas-item', {
        [`edit-gas-item-selected`]: estimateType === estimateUsed,
      })}
      role="button"
      onClick={() => setEstimateToUse(estimateType)}
    >
      <span className="edit-gas-item__name">
        <span className="edit-gas-item__icon">{GasLevelIconMap[estimateType]}</span>
        <I18nValue messageKey={estimateType} />
      </span>
      <span className={`edit-gas-item__time-estimate edit-gas-item__time-estimate-${estimateType}`}>
        {minWaitTimeEstimate && toHumanReadableTime(minWaitTimeEstimate, t)}
      </span>
      <span className={`edit-gas-item__fee-estimate edit-gas-item__fee-estimate-${estimateType}`}>
        {estimatedMinimumNative}
      </span>
      <span className="edit-gas-item__tooltip"><InfoTooltip /></span>
    </div>
  );
};

EditGasItem.propTypes = {
  estimateType: PropTypes.string,
};

export default EditGasItem;
