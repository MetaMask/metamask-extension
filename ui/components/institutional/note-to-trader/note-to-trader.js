import React from 'react';
import PropTypes from 'prop-types';
import {
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Label, Text } from '../../component-library';
import Box from '../../ui/box';

const NoteToTrader = (props) => {
  const { placeholder, maxLength, onChange, noteText, labelText } = props;

  return (
    <Box className="confirm-page-container-content__data">
      <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
        <Box
          className="note-header"
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Label htmlFor="transaction-note">{labelText}</Label>
          <Text className="note-header__counter">
            {noteText.length}/{maxLength}
          </Text>
        </Box>
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
          className="note-field"
        >
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
      </Box>
    </Box>
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
