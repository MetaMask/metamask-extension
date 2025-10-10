import React from 'react';
import { Text, TextVariant, TextColor } from '@metamask/design-system-react';

import { Tag } from '../../../../../components/component-library';

export const AccountTypeLabel = ({ label }: { label?: string }) => {
  if (!label) {
    return null;
  }

  return <Tag label={label} />;
};
