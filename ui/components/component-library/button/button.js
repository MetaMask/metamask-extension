import React from 'react';
import PropTypes from 'prop-types';
import { merge } from 'lodash';

import { ButtonBase } from '../button-base';
import { ButtonPrimary } from '../button-primary';
import { ButtonSecondary } from '../button-secondary';
import { ButtonLink } from '../button-link';

import { BUTTON_TYPES } from './button.constants';

export const Button = ({ type, ...props }) => {
  switch (type) {
    case BUTTON_TYPES.PRIMARY:
      return <ButtonPrimary {...props} />;
    case BUTTON_TYPES.SECONDARY:
      return <ButtonSecondary {...props} />;
    case BUTTON_TYPES.LINK:
      return <ButtonLink {...props} />;
    default:
      return <ButtonPrimary {...props} />;
  }
};

const buttonPropTypes = merge(
  ButtonBase.propTypes,
  ButtonSecondary.propTypes,
  ButtonPrimary.propTypes,
  ButtonLink.propTypes,
);

Button.propTypes = {
  /**
   * Select the type of Button.
   * Possible values could be 'BUTTON_TYPES.PRIMARY', 'BUTTON_TYPES.SECONDARY', 'BUTTON_TYPES.LINK'
   * Button will default to `BUTTON_TYPES.PRIMARY`
   */
  type: PropTypes.oneOf(Object.values(BUTTON_TYPES)),
  /**
   * Button accepts all button base and variant props ButtonBase, ButtonPrimary, ButtonSecondary, ButtonLink
   */
  ...buttonPropTypes,
};
