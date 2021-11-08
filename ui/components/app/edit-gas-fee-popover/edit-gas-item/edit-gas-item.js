import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { GasLevelIconMap } from '../../../../helpers/constants/gas';
import I18nValue from '../../../ui/i18n-value';
import { useGasFeeContext } from '../../../../contexts/gasFee';

const EditGasItem = ({ estimateType }) => {
  const { estimateUsed, setEstimateUsed, gasFeeEstimates } = useGasFeeContext();
  return (
    <div
      className={classNames('edit-gas-item', {
        [`edit-gas-item-selected`]: estimateType === estimateUsed,
      })}
    >
      <span className="edit-gas-item__name">
        {GasLevelIconMap[estimateType]}
        <I18nValue messageKey={estimateType} />
      </span>
    </div>
  );
};

EditGasItem.propTypes = {
  estimateType: PropTypes.string,
};

export default EditGasItem;
