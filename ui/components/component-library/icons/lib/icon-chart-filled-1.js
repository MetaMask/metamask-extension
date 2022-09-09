import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconChartFilled1 = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 461H47c-9 0-16-7-16-16 0-8 7-15 16-15h409c9 0 16 7 16 15 0 9-7 16-16 16zM205 92v369h93V92c0-22-10-41-37-41h-19c-27 0-37 19-37 41zM67 215v246h82V215c0-22-8-41-33-41h-16c-25 0-33 19-33 41zm287 102v144h82V317c0-22-8-41-33-41h-16c-25 0-33 19-33 41z" />,
  );
};
IconChartFilled1.propTypes = {
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
