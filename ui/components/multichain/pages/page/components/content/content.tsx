import React from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxFlexDirection,
  type BoxProps,
} from '@metamask/design-system-react';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ContentProps extends Omit<BoxProps, 'children' | 'ref'> {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the content
   */
  className?: string;
}

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
      className={classnames(
        'multichain-page-content flex w-full h-full',
        className,
      )}
      style={styles}
      {...props}
    >
      {children}
    </Box>
  );
};
