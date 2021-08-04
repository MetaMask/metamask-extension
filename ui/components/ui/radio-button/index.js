import React from 'react';
import PropTypes from 'prop-types';

export default function RadioButton({
  name,
  id = '',
  checked = false,
  value,
  onChange,
}) {
  return (
    <input
      type="radio"
      name={name}
      id={id}
      checked={checked}
      value={value}
      onChange={onChange}
    />
  );
}

RadioButton.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  checked: PropTypes.bool,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};
