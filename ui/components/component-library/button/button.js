import React from 'react';
import PropTypes from 'prop-types';

import { ButtonPrimary } from '../button-primary';
import { ButtonSecondary } from '../button-secondary';
import { ButtonLink } from '../button-link';

import { BUTTON_VARIANTS } from './button.constants';

export const Button = ({ variant, ...props }) => {
  switch (variant) {
    case BUTTON_VARIANTS.PRIMARY:
      return <ButtonPrimary {...props} />;
    case BUTTON_VARIANTS.SECONDARY:
      return <ButtonSecondary {...props} />;
    case BUTTON_VARIANTS.LINK:
      return <ButtonLink {...props} />;
    default:
      return <ButtonPrimary {...props} />;
  }
};

Button.propTypes = {
  /**
   * Select the variant of Button.
   * Possible values could be 'BUTTON_VARIANTS.PRIMARY', 'BUTTON_VARIANTS.SECONDARY', 'BUTTON_VARIANTS.LINK'
   * Button will default to `BUTTON_VARIANTS.PRIMARY`
   */
  variant: PropTypes.oneOf(Object.values(BUTTON_VARIANTS)),
  /**
   * Button accepts all the props from ButtonPrimary (same props as ButtonSecondary & ButtonLink)
   */
  ...ButtonPrimary.propTypes,
};
