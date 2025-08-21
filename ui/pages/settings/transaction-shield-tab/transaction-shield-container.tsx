import React from 'react';
import classnames from 'classnames';
import { Box, StyleUtilityProps } from '../../../components/component-library';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface TransactionShieldContainerProps extends StyleUtilityProps {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the content
   */
  className?: string;
}

export const TransactionShieldContainer = ({
  children,
  className = '',
  ...props
}: TransactionShieldContainerProps) => {
  return (
    <Box
      className={classnames('transaction-shield-page__container', className)}
      {...props}
    >
      {children}
    </Box>
  );
};
