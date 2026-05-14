import React from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import type { BoxProps } from '@metamask/design-system-react';

type ContentProps = Omit<BoxProps, 'children'> & {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the content
   */
  className?: string;
};

export const Content = ({
  children,
  className = '',
  ...props
}: ContentProps) => {
  const styles = {
    overflow: 'auto',
    scrollbarColor: 'var(--color-icon-muted) transparent',
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      padding={4}
      paddingTop={0}
      className={classnames('multichain-page-content w-full h-full', className)}
      style={styles}
      {...props}
    >
      {children}
    </Box>
  );
};
