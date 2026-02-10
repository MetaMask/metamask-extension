import React, { ReactNode } from 'react';
import { Text } from '@metamask/design-system-react';

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export const Row = ({ left, right }: Props) => (
  <div className="flex items-start justify-between gap-2">
    <Text className="text-text-alternative shrink-0">{left}</Text>
    <Text className="font-medium min-w-0 truncate text-right">{right}</Text>
  </div>
);
