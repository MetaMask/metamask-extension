import React from 'react';
import classnames from 'classnames';
import { Box } from '../../../../../component-library';
import {
  BlockSize,
  Display,
} from '../../../../../../helpers/constants/design-system';

import type { StyleUtilityProps } from '../../../../../component-library/box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface FooterProps extends StyleUtilityProps {
  /**
   * Elements that go in the page footer
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the footer
   */
  className?: string;
}

export const Footer = ({ children, className = '', ...props }: FooterProps) => {
  return (
    <Box
      padding={4}
      display={Display.Flex}
      width={BlockSize.Full}
      gap={4}
      className={classnames('multichain-page-footer', className)}
      {...props}
    >
      {children}
    </Box>
  );
};
