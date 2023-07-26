import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const CHECKBOX_STATE = {
  CHECKED: 'CHECKED',
  INDETERMINATE: 'INDETERMINATE',
  UNCHECKED: 'UNCHECKED',
};

export const { CHECKED, INDETERMINATE, UNCHECKED } = CHECKBOX_STATE;
/**
 * @deprecated The `<Checkbox />` component has been deprecated in favor of the new `<Checkbox>` component from the component-library.
 * Please update your code to use the new `<Checkbox>` component instead, which can be found at ui/components/component-library/checkbox/checkbox.tsx.
 * You can find documentation for the new Checkbox component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-checkbox--docs}
 * If you would like to help with the replacement of the old Checkbox component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20163}
 *
 * @param {Object} options0 - The options object.
 * @param {string} options0.className - The CSS class name for styling.
 * @param {boolean} options0.disabled - Whether the element should be disabled or not.
 * @param {string} options0.id - The unique ID for the element.
 * @param {function} options0.onClick - The click event handler function.
 * @param {boolean} options0.checked - The checked state of the element.
 * @param {string} options0.title - The title or tooltip for the element.
 * @param {string} options0.dataTestId - The data test ID for testing purposes.
 * @returns {void} - No return value (or update the return type if applicable).

 */
const CheckBox = ({
  className,
  disabled,
  id,
  onClick,
  checked,
  title,
  dataTestId,
}) => {
  if (typeof checked === 'boolean') {
    // eslint-disable-next-line no-param-reassign
    checked = checked ? CHECKBOX_STATE.CHECKED : CHECKBOX_STATE.UNCHECKED;
  }
  const ref = useRef(null);
  useLayoutEffect(() => {
    ref.current.indeterminate = checked === CHECKBOX_STATE.INDETERMINATE;
  }, [checked]);

  return (
    <input
      checked={checked === CHECKBOX_STATE.CHECKED}
      className={classnames('check-box', className, {
        'far fa-square': checked === CHECKBOX_STATE.UNCHECKED,
        'fa fa-check-square check-box__checked':
          checked === CHECKBOX_STATE.CHECKED,
        'fa fa-minus-square check-box__indeterminate':
          checked === CHECKBOX_STATE.INDETERMINATE,
      })}
      disabled={disabled}
      id={id}
      onClick={
        onClick
          ? (event) => {
              event.preventDefault();
              onClick();
            }
          : null
      }
      readOnly
      ref={ref}
      title={title}
      data-testid={dataTestId}
      type="checkbox"
    />
  );
};

CheckBox.propTypes = {
  /**
   * Add custom classname css
   */
  className: PropTypes.string,
  /**
   * Check if checkbox disabled or not
   */
  disabled: PropTypes.bool,
  /**
   * Checkbox ID
   */
  id: PropTypes.string,
  /**
   * Click handler
   */
  onClick: PropTypes.func,
  /**
   * Check if the checkbox are checked or not
   */
  checked: PropTypes.oneOf([...Object.keys(CHECKBOX_STATE), true, false])
    .isRequired,
  /**
   * Show title
   */
  title: PropTypes.string,
  /**
   * Data test ID for checkbox Component
   */
  dataTestId: PropTypes.string,
};

CheckBox.defaultProps = {
  className: undefined,
  disabled: false,
  id: undefined,
};

export default CheckBox;
