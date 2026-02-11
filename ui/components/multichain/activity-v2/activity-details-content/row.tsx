import React, { ReactNode } from 'react';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export const Row = ({ left, right }: Props) => (
  <div className="flex items-start justify-between gap-2">
    <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
      {left}
    </Text>
    <Text variant={TextVariant.BodySm} className="text-end">
      {right}
    </Text>
  </div>
);
