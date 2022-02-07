import React from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { clearClipboard } from '../../../helpers/utils/util';

export default function Password({
  clearClipboardOnPaste = false,
  id,
  placeholder,
  onChange,
  showPassword = false,
  value,
}) {
  return (
    <div className="password__container">
      <TextField
        id={id}
        type="password"
        onChange={(e) => onChange(e.target.value)}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onPaste={clearClipboardOnPaste ? clearClipboard : undefined}
      />
      {showPassword ? (
        <div className="password__shown-password">{value}</div>
      ) : null}
    </div>
  );
}

Password.propTypes = {
  clearClipboardOnPaste: PropTypes.bool,
  id: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  showPassword: PropTypes.bool,
  value: PropTypes.string.isRequired,
};
