import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconMessageQuestionFilled = ({
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
    <path d="M354 60H149C88 60 47 101 47 162v123c0 62 41 103 102 103v43c0 17 18 27 32 17l91-60h82c61 0 102-41 102-103V162c0-61-41-102-102-102zM252 309c-9 0-16-7-16-15 0-9 7-15 16-15 8 0 15 6 15 15 0 8-7 15-15 15zm25-85c-8 6-10 9-10 15v4c0 9-7 15-15 15-9 0-16-6-16-15v-4c0-24 18-36 24-40 8-5 10-9 10-14 0-10-8-19-18-19-11 0-19 9-19 19 0 8-7 15-15 15-9 0-16-7-16-15 0-27 22-49 50-49 27 0 49 22 49 49 0 23-17 35-24 39z" />,
  );
};
IconMessageQuestionFilled.propTypes = {
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
