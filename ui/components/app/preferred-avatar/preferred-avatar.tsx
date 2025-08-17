import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountProps,
  AvatarAccountVariant,
} from '@metamask/design-system-react';
import { getUseBlockie } from '../../../selectors';

export const PreferredAvatar = (props: Omit<AvatarAccountProps, 'ref'>) => {
  const variant = useSelector(getUseBlockie)
    ? AvatarAccountVariant.Blockies
    : AvatarAccountVariant.Maskicon;

  return <AvatarAccount variant={variant} {...props} />;
};
