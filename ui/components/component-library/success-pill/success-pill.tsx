import React from 'react';
import { TextColor, TextVariant } from '@metamask/design-system-react';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { Tag } from '../tag';
import type {
  SuccessPillComponent,
  SuccessPillProps,
} from './success-pill.types';

/**
 * A pill-shaped label with success (green) styling.
 * Used for "Paid by MetaMask", "No network fee", and similar labels.
 */
export const SuccessPill: SuccessPillComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  function SuccessPill<C extends React.ElementType = 'div'>(
    { label, ...props }: SuccessPillProps<C>,
    ref: React.Ref<Element>,
  ) {
    return (
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        label={label}
        backgroundColor={BackgroundColor.successMuted}
        labelProps={{ color: TextColor.SuccessDefault as never }}
        textVariant={TextVariant.BodySm}
        {...(props as React.ComponentProps<typeof Tag>)}
      />
    );
  },
);
