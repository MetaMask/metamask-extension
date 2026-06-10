import React from 'react';
import classnames from 'clsx';
import { Text } from '../text';
import type { TextProps } from '../text';
import {
  FontWeight,
  TextVariant,
  Display,
  AlignItems,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import { LabelProps, LabelComponent } from './label.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the Label component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#label-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-label--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/Label | Component Source}
 */
export const Label: LabelComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'label'>(
    { htmlFor, className, children, ...props }: LabelProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Text
        className={classnames(
          'mm-label',
          { 'mm-label--html-for': Boolean(htmlFor) },
          className ?? '',
        )}
        as="label"
        htmlFor={htmlFor}
        variant={TextVariant.bodyMd}
        fontWeight={FontWeight.Medium}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        ref={ref}
        {...(props as TextProps<C>)}
      >
        {children}
      </Text>
    );
  },
);
