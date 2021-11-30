import React from 'react';
import PropTypes from 'prop-types';

import Dropdown from '../../../components/ui/dropdown/dropdown';

export default function ConnectHardwarePathSelector({
  className = '',
  onChange,
  options = [],
  selectedOption = '',
}) {
  return (
    <Dropdown
      className={className}
      options={options}
      selectedOption={selectedOption}
      onChange={onChange}
    />
  );
}

ConnectHardwarePathSelector.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array,
  selectedOption: PropTypes.string,
};
