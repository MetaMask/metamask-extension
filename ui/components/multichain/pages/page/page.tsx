import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box } from '../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
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
      display={Display.Flex}
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      style={{ height: '100%' }}
      className={classnames('multichain-page', className)}
      {...props}
    >
      {children}
    </Box>
  );
};

Page.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
