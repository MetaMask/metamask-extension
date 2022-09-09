import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { BUTTON_SIZES } from '../../../../helpers/constants/design-system';

import { BaseButton } from '../base-button/base-button';

const primaryButtonSizes = BUTTON_SIZES;
delete primaryButtonSizes.XS;

export const PrimaryButton = ({
  className,
  children,
  isDanger,
  isDisabled,
  isLoading,
  ...props
}) => {
  return (
    <BaseButton
      className={classnames(className, 'base-button-primary', {
        [`base-button-primary--danger`]: Boolean(isDanger),
        [`base-button-primary--disabled`]: Boolean(isDisabled),
        [`base-button-primary--loading`]: Boolean(isLoading),
      })}
      {...props}
    >
      {/* {children}
      {isLoading && <div className="spinner"></div>} */}

      {isLoading ? (
        <div style={{ width: 20 }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>{children}</>
      )}
    </BaseButton>
  );
};

PrimaryButton.propTypes = {
  /**
   * The size of the BaseButton.
   * Possible values could be 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG', 'BUTTON_SIZES.XL',
   * Default value is 'BUTTON_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(primaryButtonSizes)),
  /**
   * An additional className to apply to the icon.
   */
  className: PropTypes.string,
  /**
   * The children to be rendered inside the PrimaryButton
   */
  children: PropTypes.node,
  /**
   * Boolean to change button color to danger(red)
   */
  isDanger: PropTypes.bool,
  /**
   * Boolean to disable button
   */
  isDisabled: PropTypes.bool,
  /**
   * Boolean to show loading wheel in button
   */
  isLoading: PropTypes.bool,
  /**
   * PrimaryButton accepts all the props from Box
   */
  ...BaseButton.propTypes,
};
