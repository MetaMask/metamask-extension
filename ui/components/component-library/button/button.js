import React from 'react';
import PropTypes from 'prop-types';

import { ButtonPrimary } from '../button-primary';
import { ButtonSecondary } from '../button-secondary';
import { ButtonLink } from '../button-link';

import { BUTTON_TYPES } from './button.constants';

export const Button = ({ type, ...props }) => {
  switch (type) {
    case BUTTON_TYPES.SECONDARY:
      return <ButtonSecondary {...props} />;
    case BUTTON_TYPES.LINK:
      return <ButtonLink {...props} />;
    default:
      return <ButtonPrimary {...props} />;
  }
};

Button.propTypes = {
  /**
   * Addition style properties to apply to the button.
   */
  style: PropTypes.object,
  /**
   * Button accepts all the props from Box
   */
  ...ButtonLink.propTypes,
};
