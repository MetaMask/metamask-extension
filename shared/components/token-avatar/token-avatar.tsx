import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
} from '@metamask/design-system-react';

export type TokenAvatarProps = Readonly<{
  name: string;
  src?: string;
  size?: AvatarTokenSize;
  network?: Readonly<{
    name: string;
    src?: string;
    hasBorder?: boolean;
    className?: string;
  }>;
  className?: string;
}>;

export function TokenAvatar({
  name,
  src,
  size = AvatarTokenSize.Md,
  network,
  className,
}: TokenAvatarProps) {
  return (
    <BadgeWrapper
      className={className}
      badge={
        network ? (
          <AvatarNetwork
            name={network.name}
            src={network.src}
            size={AvatarNetworkSize.Xs}
            hasBorder={network.hasBorder}
            className={network.className}
          />
        ) : null
      }
    >
      <AvatarToken name={name} src={src} size={size} />
    </BadgeWrapper>
  );
}
