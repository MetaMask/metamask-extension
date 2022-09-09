import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconGlobalSearchFilled = ({
  size,
  color,
  className,
  ...props
}) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="m452 437-14-14c7-11 12-25 12-39 0-38-32-69-70-69-39 0-70 31-70 69 0 39 31 70 70 70 14 0 27-4 38-11l14 14c3 2 7 4 10 4 4 0 7-2 10-4 6-6 6-15 0-20zM67 317c0 1-1 1-1 2 18 36 48 65 84 83h1c-6-23-11-46-15-69-23-4-47-9-69-16zm332-160c-18-38-49-69-87-87 7 23 12 47 16 70 24 4 48 10 71 17zm-334 0c23-7 47-13 71-17 4-23 9-46 15-69h-2c-36 18-66 49-84 86zm232-21c-5-25-11-50-19-75-1-1-1-3-1-4-14-4-29-6-45-6s-31 2-45 6c-1 1 0 3-1 4-8 25-14 50-19 75 43-4 87-4 130 0zm-165 36c-26 4-51 10-76 19h-3c-4 15-6 30-6 46 0 15 2 30 6 45h4c24 9 49 15 75 19-5-43-5-86 0-129zm279 19h-4c-24-9-50-15-75-19 5 43 5 86 0 129 25-5 51-10 75-19h4c4-15 6-30 6-46 0-15-2-30-6-45zM167 337c5 25 11 50 19 75 1 1 0 3 1 4 14 4 29 6 45 6s31-2 45-6c0-1 0-3 1-4 8-25 14-50 19-75-22 2-43 4-65 4s-43-2-65-4zm-4-170c-6 46-6 93 0 139 46 6 92 6 138 0 6-46 6-93 0-139-46-6-92-6-138 0z" />,
  );
};
IconGlobalSearchFilled.propTypes = {
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
