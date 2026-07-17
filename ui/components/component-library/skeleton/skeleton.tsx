import React from 'react';
import classnames from 'clsx';

import {
  BackgroundColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { Box } from '../box';
import type { PolymorphicRef, BoxProps } from '../box';

import { SkeletonProps, SkeletonComponent } from './skeleton.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the Skeleton component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#skeleton-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-skeleton--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/Skeleton | Component Source}
 */
export const Skeleton: SkeletonComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      height,
      width,
      children,
      isLoading = true,
      ...props
    }: SkeletonProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    if (!isLoading) {
      return <>{children}</>;
    }
    return (
      <Box
        className={classnames('mm-skeleton', className)}
        backgroundColor={BackgroundColor.iconAlternative}
        borderRadius={BorderRadius.SM}
        ref={ref}
        {...(props as BoxProps<C>)}
        style={{ ...props?.style, height, width }}
      >
        {children}
      </Box>
    );
  },
);

export default Skeleton;
