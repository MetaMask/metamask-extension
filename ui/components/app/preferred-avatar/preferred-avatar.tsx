import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountProps,
  AvatarAccountVariant,
} from '@metamask/design-system-react';
import type { MetaMaskReduxState } from '../../../store/store';

/**
 * Renders an avatar for an address based on the user's settings. This wraps AvatarAccount.
 *
 * @param props - Props to pass to AvatarAccount
 */
export const PreferredAvatar = (props: Omit<AvatarAccountProps, 'ref'>) => {
  const variant = useSelector(getAvatarType);

  return <AvatarAccount {...props} variant={variant} />;
};

const avatarTypeMap = {
  maskicon: AvatarAccountVariant.Maskicon,
  jazzicon: AvatarAccountVariant.Jazzicon,
  blockies: AvatarAccountVariant.Blockies,
};

function getAvatarType({ metamask: { preferences } }: MetaMaskReduxState) {
  const avatarType = preferences?.avatarType;
  return avatarType ? avatarTypeMap[avatarType] : undefined;
}
