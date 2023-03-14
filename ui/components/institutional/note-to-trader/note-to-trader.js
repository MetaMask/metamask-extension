import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box';

const NoteToTrader = (props) => {
  const { placeholder, maxLength, onChange, noteText, labelText } = props;

  return (
    <>
      <Box className="note-header">
        <label htmlFor="transaction-note">{labelText}</label>
        <p className="note-header__counter">
          {noteText.length}/{maxLength}
        </p>
      </Box>
      <Box className="note-field">
        <textarea
          id="transaction-note"
          data-testid="transaction-note"
          onChange={({ target: { value } }) => onChange(value)}
          autoFocus
          maxLength={maxLength}
          placeholder={placeholder}
          value={noteText}
        />
      </Box>
    </>
  );
};

NoteToTrader.propTypes = {
  placeholder: PropTypes.string,
  maxLength: PropTypes.string,
  onChange: PropTypes.func,
  noteText: PropTypes.string,
  labelText: PropTypes.string,
};

export default NoteToTrader;
