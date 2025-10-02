import React from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { PreferredAvatar } from '../../preferred-avatar';

type SnapUIAvatarProps = {
  // The address must be a CAIP-10 string.
  address: string;
  size?: AvatarAccountSize;
};

export const SnapUIAvatar: React.FunctionComponent<SnapUIAvatarProps> = ({
  address,
  size,
}) => {
  return <PreferredAvatar address={address} size={size} />;
};
