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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  function SuccessPill(
    { label, ...props }: SuccessPillProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    return (
      <Tag
        ref={ref}
        {...props}
        label={label}
        backgroundColor={BackgroundColor.successMuted}
        labelProps={{ color: TextColor.SuccessDefault as never }}
        textVariant={TextVariant.BodySm}
      />
    );
  },
);
