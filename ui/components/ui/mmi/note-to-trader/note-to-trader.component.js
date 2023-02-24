import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class NoteToTrader extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    maxLength: PropTypes.string,
    onChange: PropTypes.func,
    noteText: PropTypes.string,
    labelText: PropTypes.string,
  };

  render() {
    const { placeholder, maxLength, onChange, noteText, labelText } =
      this.props;

    return (
      <>
        <div className="note-header">
          <label htmlFor="transaction-note">{labelText}</label>
          <p className="note-header__counter">
            {noteText.length}/{maxLength}
          </p>
        </div>
        <div className="note-field">
          <textarea
            id="transaction-note"
            data-testid="transaction-note"
            onChange={({ target: { value } }) => onChange(value)}
            autoFocus
            maxLength={maxLength}
            placeholder={placeholder}
            value={noteText}
          />
        </div>
      </>
    );
  }
}
