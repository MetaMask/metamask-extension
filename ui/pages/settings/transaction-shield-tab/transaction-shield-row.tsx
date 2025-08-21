import React from 'react';
import classnames from 'classnames';
import { Box, StyleUtilityProps } from '../../../components/component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface TransactionShieldRowProps extends StyleUtilityProps {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the content
   */
  className?: string;
}

export const TransactionShieldRow = ({
  children,
  className = '',
  ...props
}: TransactionShieldRowProps) => {
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundSection}
      padding={4}
      className={classnames('transaction-shield-page__row', className)}
      {...props}
    >
      {children}
    </Box>
  );
};
