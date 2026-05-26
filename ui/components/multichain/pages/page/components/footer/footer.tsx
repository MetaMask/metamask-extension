import React from 'react';
import classnames from 'clsx';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import type { BoxProps } from '@metamask/design-system-react';

type FooterProps = Omit<BoxProps, 'children'> & {
  /**
   * Elements that go in the page footer
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the footer
   */
  className?: string;
  /**
   * Additional CSS style provided to the footer
   */
  style?: React.CSSProperties;
};

export const Footer = ({ children, className = '', ...props }: FooterProps) => {
  return (
    <Box
      padding={4}
      flexDirection={BoxFlexDirection.Row}
      gap={4}
      className={classnames('multichain-page-footer w-full', className)}
      {...props}
    >
      {children}
    </Box>
  );
};
