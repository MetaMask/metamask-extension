import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountProps,
  AvatarAccountVariant,
} from '@metamask/design-system-react';
import { getUseBlockie } from '../../../selectors';

export function PreferredAvatar(props: Omit<AvatarAccountProps, 'ref'>) {
  const useBlockie = useSelector(getUseBlockie);

  return (
    <AvatarAccount
      variant={
        useBlockie
          ? AvatarAccountVariant.Blockies
          : AvatarAccountVariant.Jazzicon
      }
      {...props}
    />
  );
}
