import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconBankTokenFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M22 15c0 4-3 7-7 7l1-2M2 9c0-4 3-7 7-7L8 4m223 451H26v-31c0-5 5-10 10-10h185c5 0 10 5 10 10zm-6-166-93-37c-2-1-5-1-7 0l-92 37c-4 1-7 5-7 9v34c0 6 5 11 10 11h185c5 0 10-5 10-11v-34c0-4-3-8-6-9zm-76 8c0 11-9 20-20 20-12 0-21-9-21-20s9-21 21-21c11 0 20 10 20 21zm82 158v8c4 0 8-4 8-8zm-205 0h-7c0 4 3 8 7 8zm13-41c0 4 3 8 8 8 4 0 7-4 7-8zm15-71c0-5-3-8-7-8-5 0-8 3-8 8zm26 71c0 4 3 8 8 8 4 0 7-4 7-8zm15-71c0-5-3-8-7-8-5 0-8 3-8 8zm26 71c0 4 3 8 8 8 4 0 7-4 7-8zm15-71c0-5-3-8-7-8-5 0-8 3-8 8zm26 71c0 4 3 8 8 8 4 0 7-4 7-8zm15-71c0-5-3-8-7-8-5 0-8 3-8 8zm26 71c0 4 3 8 8 8 4 0 7-4 7-8zm15-71c0-5-3-8-7-8-5 0-8 3-8 8zM16 447c-4 0-8 4-8 8s4 8 8 8zm225 16c4 0 8-4 8-8s-4-8-8-8zM132 252l-2 7zm93 37 2-7zm-100-37 3 7zm-92 37-3-7zm198 158H26v16h205zm-197 8v-31H19v31zm0-31c0-1 1-2 2-2v-15c-9 0-17 8-17 17zm2-2h185v-15H36zm185 0c1 0 2 1 2 2h16c0-9-8-17-18-17zm2 2v31h16v-31zM54 414v-71H39v71zm41 0v-71H80v71zm41 0v-71h-15v71zm41 0v-71h-15v71zm41 0v-71h-15v71zM16 463h225v-16H16zm114-204 92 37 5-14-92-37zm-2 0h2l5-14c-2-1-4-1-6-1s-5 0-7 1zm-92 37 92-37-6-14-92 37zm-2 2s0-1 1-1v-1h1l-6-14c-4 1-6 4-8 6-2 3-3 7-3 10zm0 34v-34H19v34zm2 3c-1 0-2-1-2-3H19c0 10 8 18 17 18zm185 0H36v15h185zm2-3c0 2-1 3-2 3v15c10 0 18-8 18-18zm0-34v34h16v-34zm-1-2 1 1v1h16c0-3-2-7-3-10-2-2-5-5-9-6zm-93 29c15 0 28-13 28-28h-16c0 7-5 13-12 13zm-29-28c0 15 13 28 29 28v-15c-7 0-13-6-13-13zm29-28c-16 0-29 12-29 28h16c0-7 6-13 13-13zm28 28c0-16-13-28-28-28v15c7 0 12 6 12 13zm107-163 65-28c3-2 6-2 10 0l65 28c6 3 11-4 7-9l-68-83c-4-6-12-6-16 0l-69 83c-5 5 0 12 6 9zm0 80 65 28c3 2 6 2 10 0l65-28c6-3 11 4 7 9l-68 84c-4 5-12 5-16 0l-69-84c-5-5 0-12 6-9zm69-75-71 35 71 36 71-36z" />,
  );
};
IconBankTokenFilled.propTypes = {
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
