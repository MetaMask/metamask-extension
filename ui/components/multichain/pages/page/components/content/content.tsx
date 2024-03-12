import React from 'react';
import classnames from 'classnames';
import { Box } from '../../../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../../helpers/constants/design-system';
import type { StyleUtilityProps } from '../../../../../component-library/box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ContentProps extends StyleUtilityProps {
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
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
      padding={4}
      height={BlockSize.Full}
      className={classnames('multichain-page-content', className)}
      {...props}
    >
      {children}
    </Box>
  );
};
