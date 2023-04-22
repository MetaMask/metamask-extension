import React from 'react';
import PropTypes from 'prop-types';

import { ButtonPrimary } from '../button-primary';
import { ButtonSecondary } from '../button-secondary';
import { ButtonLink } from '../button-link';

import { BUTTON_VARIANT } from './button.constants';

export const Button = ({ variant, ...props }) => {
  switch (variant) {
    case BUTTON_VARIANT.PRIMARY:
      return <ButtonPrimary {...props} />;
    case BUTTON_VARIANT.SECONDARY:
      return <ButtonSecondary {...props} />;
    case BUTTON_VARIANT.LINK:
      return <ButtonLink {...props} />;
    default:
      return <ButtonPrimary {...props} />;
  }
};

Button.propTypes = {
  /**
   * Select the type of Button.
   * Possible values could be 'BUTTON_VARIANT.PRIMARY', 'BUTTON_VARIANT.SECONDARY', 'BUTTON_VARIANT.LINK'
   * Button will default to `BUTTON_VARIANT.PRIMARY`
   */
  variant: PropTypes.oneOf(Object.values(BUTTON_VARIANT)),
  /**
   * Button accepts all the props from ButtonPrimary (same props as ButtonSecondary & ButtonLink)
   */
  ...ButtonPrimary.propTypes,
};
