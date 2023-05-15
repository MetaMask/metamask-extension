import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonIcon, ButtonIconSize, Icon, IconName, IconSize } from '..';
import { TextField, TEXT_FIELD_TYPES } from '../text-field';

export const TextFieldSearch = ({
  className,
  showClearButton = true, // only works with a controlled input
  clearButtonOnClick,
  clearButtonProps,
  endAccessory,
  inputProps,
  value,
  onChange,
  ...props
}) => (
  <TextField
    className={classnames('mm-text-field-search', className)}
    value={value}
    onChange={onChange}
    type={TEXT_FIELD_TYPES.SEARCH}
    endAccessory={
      value && showClearButton ? (
        <>
          <ButtonIcon
            className="mm-text-field__button-clear"
            ariaLabel="Clear" // TODO: i18n
            iconName={IconName.Close}
            size={ButtonIconSize.Sm}
            onClick={clearButtonOnClick}
            {...clearButtonProps}
          />
          {endAccessory}
        </>
      ) : (
        endAccessory
      )
    }
    startAccessory={<Icon name={IconName.Search} size={IconSize.Sm} />}
    inputProps={{
      marginRight: showClearButton ? 6 : 0,
      ...inputProps,
    }}
    {...props}
  />
);

TextFieldSearch.propTypes = {
  /**
   * The value of the TextFieldSearch
   */
  value: TextField.propTypes.value,
  /**
   * The onChange handler of the TextFieldSearch
   */
  onChange: TextField.propTypes.onChange,
  /**
   * The clear button for the TextFieldSearch.
   * Defaults to true
   */
  showClearButton: PropTypes.bool,
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
  /**
   * Component to appear on the right side of the input
   */
  endAccessory: PropTypes.node,
  /**
   * Attributes applied to the `input` element.
   */
  inputProps: PropTypes.object,
  /**
   * FormTextField accepts all the props from TextField and Box
   */
  ...TextField.propTypes,
};

TextFieldSearch.displayName = 'TextFieldSearch';
