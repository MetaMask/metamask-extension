import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box } from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';

import type { StyleUtilityProps } from '../../../component-library/box';

interface PageProps extends StyleUtilityProps {
  /**
   * Elements that go in the page footer
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the footer
   */
  className?: string;
}

export const Page = ({ children, className = '', ...props }: PageProps) => {
  return (
    <Box
      width={BlockSize.Full}
      height={BlockSize.Full}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.backgroundAlternative}
      className="multichain-page"
    >
      <Box
        width={BlockSize.Full}
        height={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        backgroundColor={BackgroundColor.backgroundDefault}
        className={classnames('multichain-page__inner-container', className)}
        {...props}
      >
        {children}
      </Box>
    </Box>
  );
};

Page.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
