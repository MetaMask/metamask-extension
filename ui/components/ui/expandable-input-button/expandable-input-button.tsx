import React, { useState } from 'react';
import { Box, ButtonBase, TextField } from '../../../components/component-library';
import { Display, FlexDirection, AlignItems, BlockSize } from '../../../helpers/constants/design-system';
import { Icon, IconName, IconSize } from '../../../components/component-library/icon';
import classnames from 'classnames';
export type ExpandableInputButtonProps = {
  buttonText: string;
  inputPlaceholder?: string;
  onInputChange?: (value: string) => void;
  onButtonClick?: () => void;
  inputValue?: string;
  disabled?: boolean;
};

export default function ExpandableInputButton({
  buttonText,
  inputPlaceholder,
  onInputChange,
  onButtonClick,
  inputValue,
  disabled,
}: ExpandableInputButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [internalValue, setInternalValue] = useState('');

  const handleButtonClick = () => {
    setExpanded((prev) => !prev);
    if (onButtonClick) onButtonClick();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    if (onInputChange) onInputChange(e.target.value);
  };

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      <ButtonBase
        width={BlockSize.Full}
        onClick={handleButtonClick}
        disabled={disabled}
        className='expandable-input-button'
      >
        <span className='expandable-input-button__text'>{buttonText}</span>
        <Icon
          name={IconName.ArrowDown}
          size={IconSize.Xs}
          className={classnames({'expandable-input-button__icon':true,
            "expandable-input-button__icon--expanded": expanded,
            "expandable-input-button__icon--default": !expanded,
           })}
        />
      </ButtonBase>
      {expanded && (
        <TextField
          placeholder={inputPlaceholder}
          value={inputValue !== undefined ? inputValue : internalValue}
          onChange={handleInputChange}
          autoFocus
        />
      )}
    </Box>
  );
}
