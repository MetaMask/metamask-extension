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
        <div className="edit-gas-fee-popover__mm-recommended">
          <div className="edit-gas-fee-popover__mm-recommended__header">
            <span>Gas option</span>
            <span>Type</span>
            <span>Max fee</span>
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
