import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountProps,
  AvatarAccountVariant,
} from '@metamask/design-system-react';
import { getUseBlockie } from '../../../selectors';

/**
 * Renders an avatar for an address based on the user's settings. This wraps AvatarAccount.
 *
 * @param props - Props to pass to AvatarAccount
 */
export const PreferredAvatar = (props: Omit<AvatarAccountProps, 'ref'>) => {
  const variant = useSelector(getUseBlockie)
    ? AvatarAccountVariant.Blockies
    : AvatarAccountVariant.Jazzicon;

  return <AvatarAccount {...props} variant={variant} />;
};
