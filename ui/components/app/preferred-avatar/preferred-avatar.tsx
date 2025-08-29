import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountProps,
  AvatarAccountVariant,
} from '@metamask/design-system-react';
import type { MetaMaskReduxState } from '../../../store/store';

const defaultVariant = AvatarAccountVariant.Maskicon;

/**
 * Renders an avatar for an address based on the user's settings. This wraps AvatarAccount.
 *
 * @param props - Props to pass to AvatarAccount
 */
export const PreferredAvatar = (props: Omit<AvatarAccountProps, 'ref'>) => {
  const variant = useSelector(getAvatarType);

  return <AvatarAccount {...props} variant={variant} />;
};

function getAvatarType({
  metamask: { useBlockie, preferences },
}: MetaMaskReduxState) {
  const avatarType = preferences?.avatarType;

  if (avatarType === undefined) {
    return useBlockie ? AvatarAccountVariant.Blockies : defaultVariant;
  }
  if (avatarType === 'maskicon') {
    return AvatarAccountVariant.Maskicon;
  }
  if (avatarType === 'jazzicon') {
    return AvatarAccountVariant.Jazzicon;
  }
  if (avatarType === 'blockies') {
    return AvatarAccountVariant.Blockies;
  }

  return defaultVariant;
}
