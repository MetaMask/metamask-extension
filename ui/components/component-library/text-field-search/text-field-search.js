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
    leftAccessory={<Icon name={ICON_NAMES.SEARCH} size={SIZES.SM} />}
    showClearButton
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
   * The onClick handler for the clear button
   * Required unless showClearButton is false
   *
   * @param {object} props - The props passed to the component.
   * @param {string} propName - The prop name in this case 'id'.
   * @param {string} componentName - The name of the component.
   */
  clearButtonOnClick: (props, propName, componentName) => {
    if (
      props.showClearButton &&
      (!props[propName] || !props.clearButtonProps?.onClick)
    ) {
      return new Error(
        `${propName} is required unless showClearButton is false. Warning coming from ${componentName} ui/components/component-library/text-field-search/text-field-search.js`,
      );
    }
    return null;
  },
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
