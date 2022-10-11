import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  SIZES,
  DISPLAY,
  JUSTIFY_CONTENT,
  ALIGN_ITEMS,
  COLORS,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { Icon, ICON_NAMES } from '../icon';

import { TextFieldBase } from '../text-field-base';

export const TextField = ({
  className,
  showClear,
  clearIconProps,
  clearButtonProps,
  rightAccessory,
  value: valueProp,
  onChange,
  onClear,
  inputProps,
  ...props
}) => {
  const [value, setValue] = useState(valueProp || '');
  const handleOnChange = (e) => {
    setValue(e.target.value);
    onChange?.(e);
  };
  const handleClear = (e) => {
    setValue('');
    clearButtonProps?.onClick?.(e);
    onClear?.(e);
  };
  return (
    <TextFieldBase
      className={classnames('mm-text-field', className)}
      value={value}
      onChange={handleOnChange}
      rightAccessory={
        value && showClear ? (
          <>
            {/* replace with ButtonIcon */}
            <Box
              className="mm-text-field__button-clear"
              as="button"
              display={DISPLAY.FLEX}
              alignItems={ALIGN_ITEMS.CENTER}
              justifyContent={JUSTIFY_CONTENT.CENTER}
              backgroundColor={COLORS.TRANSPARENT}
              padding={0}
              {...clearButtonProps} // don't override onClick
              onClick={handleClear}
            >
              <Icon
                name={ICON_NAMES.CLOSE_OUTLINE}
                size={SIZES.SM}
                aria-label="Clear" // TODO: i18n
                {...clearIconProps}
              />
            </Box>
            {rightAccessory}
          </>
        ) : (
          rightAccessory
        )
      }
      inputProps={{
        marginRight: showClear ? 6 : 0,
        ...inputProps,
      }}
      {...props}
    />
  );
};

TextField.propTypes = {
  /**
   * An additional className to apply to the text-field
   */
  className: PropTypes.string,
  /**
   * Show a clear button to clear the input
   */
  showClear: PropTypes.bool,
  /**
   * TextField accepts all the props from TextFieldBase and Box
   */
  ...TextFieldBase.propTypes,
};

TextField.displayName = 'TextField';
