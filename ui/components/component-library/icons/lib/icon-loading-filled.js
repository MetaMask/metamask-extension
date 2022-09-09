import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconLoadingFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M332 435c4 11 17 16 27 11 27-14 50-33 69-56 23-28 38-63 44-99s3-74-10-109c-12-34-34-65-62-89s-62-40-99-47c-36-6-73-4-108 8s-66 33-91 61c-20 22-34 48-43 76-4 12 4 23 15 25 12 3 23-5 27-16 7-21 18-40 33-57 20-22 45-39 73-48 28-10 58-12 87-7 29 6 56 19 78 38 23 19 40 43 50 71s13 58 8 87c-4 29-17 57-35 79-15 18-32 32-51 43-11 6-16 18-12 29z" />,
  );
};
IconLoadingFilled.propTypes = {
  /**
   * The size of the BaseIcon.
   * Possible values could be 'xxs', 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),

  /**
   * The color of the icon. Defaults to 'inherit'.
   */
  color: PropTypes.string,

  /**
   * An additional class name to apply to the icon.
   */
  className: PropTypes.string,

  /**
   * BaseIcon accepts all the props from Box
   */
  ...Box.propTypes,
};
