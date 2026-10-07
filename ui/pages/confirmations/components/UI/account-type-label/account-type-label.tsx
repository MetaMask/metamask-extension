import React from 'react';

import { Tag } from '../../../../../components/component-library/tag/tag';

export const AccountTypeLabel = ({ label }: { label?: string }) => {
  if (!label) {
    return null;
  }

  return <Tag label={label} />;
};
