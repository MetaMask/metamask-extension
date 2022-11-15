import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { SIZES } from '../../../helpers/constants/design-system';

import { ButtonIcon } from '../button-icon';
import { Icon, ICON_NAMES } from '../icon';
import { TextFieldBase, TEXT_FIELD_BASE_TYPES } from '../text-field-base';
import { TextField } from '../text-field';

export const TextFieldSearch = ({
  value,
  onChange,
  showClearButton = true,
  clearButtonOnClick,
  clearButtonProps,
  className,
  ...props
}) => (
  <TextField
    className={classnames('mm-text-field-search', className)}
    value={value}
    onChange={onChange}
    type={TEXT_FIELD_BASE_TYPES.SEARCH}
    leftAccessory={<Icon name={ICON_NAMES.SEARCH_FILLED} size={SIZES.SM} />}
    showClearButton={showClearButton}
    clearButtonOnClick={clearButtonOnClick}
    clearButtonProps={clearButtonProps}
    {...props}
  />
);

TextFieldSearch.propTypes = {
  /**
   * The value of the TextFieldSearch
   */
  value: TextFieldBase.propTypes.value,
  /**
   * The onChange handler of the TextFieldSearch
   */
  onChange: TextFieldBase.propTypes.onChange,
  /**
   * Show a clear button to clear the input
   * Defaults to true
   */
  showClearButton: PropTypes.bool,
  /**
   * The onClick handler for the clear button
   */
  clearButtonOnClick: PropTypes.func,
  /**
   * The props to pass to the clear button
   */
  clearButtonProps: PropTypes.shape(ButtonIcon.PropTypes),
  /**
   * An additional className to apply to the TextFieldSearch
   */
  className: PropTypes.string,
};

TextFieldSearch.displayName = 'TextFieldSearch';
