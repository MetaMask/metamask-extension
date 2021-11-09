import React from 'react';
import PropTypes from 'prop-types';

import Popover from '../../ui/popover';

import EditGasItem from './edit-gas-item';

const EditGasFeePopover = ({ onClose }) => {
  return (
    <Popover
      title="Edit gas fee"
      onClose={onClose}
      className="edit-gas-fee-popover"
    >
      <div className="edit-gas-fee-popover__wrapper">
        <div className="edit-gas-fee-popover__content">
          <div className="edit-gas-fee-popover__content__header">
            <span className="edit-gas-fee-popover__content__header-option"><I18nValue messageKey="gasOption" /></span>
            <span className="edit-gas-fee-popover__content__header-time"><I18nValue messageKey="time" /></span>
            <span className="edit-gas-fee-popover__content__header-max-fee"><I18nValue messageKey="maxFee" /></span>
          </div>
          <EditGasItem estimateType="low" />
          <EditGasItem estimateType="medium" />
          <EditGasItem estimateType="high" />
        </div>
      </div>
    </Popover>
  );
};

EditGasFeePopover.propTypes = {
  onClose: PropTypes.func,
};

export default EditGasFeePopover;

// <I18nValue messageKey="maxFee" />