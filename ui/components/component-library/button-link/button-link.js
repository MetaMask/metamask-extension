import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  BUTTON_SIZES,
  BUTTON_TYPES,
} from '../../../helpers/constants/design-system';

import { ButtonBase } from '../button-base';

export const ButtonLink = ({
  type = BUTTON_TYPES.NORMAL,
  className,
  children,
  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(
        className,
        'mm-button-link',
        `mm-button-link--type-${type}`,
      )}
      {...props}
    >
      {children}
    </ButtonBase>
  );
};

ButtonLink.propTypes = {
  /**
   * The size of the ButtonLink.
   * Possible values could be 'BUTTON_SIZES.AUTO', 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG',
   * Default value is 'BUTTON_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  /**
   * Possible values could be 'BUTTON_TYPES.NORMAL', 'BUTTON_TYPES.DANGER'
   * Default value is 'BUTTON_TYPES.NORMAL'.
   */
  type: PropTypes.oneOf(Object.values(BUTTON_TYPES)),
  /**
   * An additional className to apply to the button
   */
  className: PropTypes.string,
  /**
   * The children to be rendered inside the ButtonLink
   */
  children: PropTypes.node,
  /**
   * ButtonLink accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};

export default ButtonLink;
