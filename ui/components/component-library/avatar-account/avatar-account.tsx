import React from 'react';
import classnames from 'classnames';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import BlockieIdenticon from '../../ui/identicon/blockieIdenticon/blockieIdenticon.component';

import type { PolymorphicRef } from '../box';

import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import {
  getCaipNamespaceFromAddress,
} from '../../../../shared/lib/multichain';
import {
  AvatarAccountDiameter,
  AvatarAccountVariant,
  AvatarAccountSize,
  AvatarAccountComponent,
  AvatarAccountProps,
} from './avatar-account.types';
import { KnownCaipNamespace } from '@metamask/utils';

function getJazziconNamespace(address: string): string | undefined {
  const namespace = getCaipNamespaceFromAddress(address);

  switch (namespace) {
    case KnownCaipNamespace.Bip122:
      return namespace;
    case KnownCaipNamespace.Eip155:
      return undefined; // Falls back to default Jazzicon behavior
    default:
      return undefined;
  }
}

export const AvatarAccount: AvatarAccountComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      size = AvatarAccountSize.Md,
      address,
      className = '',
      variant = AvatarAccountVariant.Jazzicon,
      ...props
    }: AvatarAccountProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
    <AvatarBase
      ref={ref}
      size={size}
      className={classnames('mm-avatar-account', className)}
      {...(props as AvatarBaseProps<C>)}
    >
      {variant === AvatarAccountVariant.Jazzicon ? (
        <Jazzicon
          className={classnames('mm-avatar-account__jazzicon')}
          address={address}
          namespace={getJazziconNamespace(address)}
          diameter={AvatarAccountDiameter[size]}
        />
      ) : (
        <BlockieIdenticon
          address={address}
          diameter={AvatarAccountDiameter[size]}
          borderRadius="50%"
        />
      )}
    </AvatarBase>
  ),
);
