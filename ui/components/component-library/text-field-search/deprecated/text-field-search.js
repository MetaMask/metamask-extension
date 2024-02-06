import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  TextField,
  TextFieldType,
} from '../..';
import { useI18nContext } from '../../../../hooks/useI18nContext';

/**
 * @deprecated This has been deprecated in favor of the TypeScript version `<TextFeildSearch />` component in ./ui/components/component-library/text-field-search/text-field-search.tsx
 * See storybook documentation for TextFieldSearch here https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-textfieldsearch--docs
 */

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
}) => {
  const t = useI18nContext();
  return (
    <TextField
      className={classnames('mm-text-field-search', className)}
      value={value}
      onChange={onChange}
      type={TextFieldType.Search}
      endAccessory={
        value && showClearButton ? (
          <>
            <ButtonIcon
              className="mm-text-field__button-clear"
              ariaLabel={t('clear')}
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
      startAccessory={
        <Icon padding={1} name={IconName.Search} size={IconSize.Sm} />
      }
      inputProps={{
        ...inputProps,
      }}
      {...props}
    />
  );
};

TextFieldSearch.propTypes = {
  /**
   * The value of the TextFieldSearch
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * The onChange handler of the TextFieldSearch
   */
  onChange: PropTypes.func,
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
  clearButtonProps: PropTypes.object,
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
};

TextFieldSearch.displayName = 'TextFieldSearch';
