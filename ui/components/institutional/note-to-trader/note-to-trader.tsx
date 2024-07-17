import React from 'react';
import PropTypes from 'prop-types';
import {
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Label, Box, Text } from '../../component-library';

interface NoteToTraderProps {
  placeholder: string;
  maxLength: number;
  onChange: (value: string) => void;
  noteText: string;
  labelText: string;
}

const NoteToTrader: React.FC<NoteToTraderProps> = ({
  placeholder,
  maxLength,
  onChange,
  noteText,
  labelText,
}) => {
  return (
    <Box className="confirm-page-container-content__data">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
      >
        <Box
          className="note-header"
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Label htmlFor="transaction-note">{labelText}</Label>
          <Text className="note-header__counter">
            {noteText.length}/{maxLength}
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
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
