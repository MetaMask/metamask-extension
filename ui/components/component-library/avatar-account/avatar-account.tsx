import React from 'react';
import classnames from 'classnames';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import BlockieIdenticon from '../../ui/identicon/blockieIdenticon/blockieIdenticon.component';

import type { PolymorphicRef } from '../box';

import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../../../shared/lib/multichain';
import {
  AvatarAccountDiameter,
  AvatarAccountVariant,
  AvatarAccountSize,
  AvatarAccountComponent,
  AvatarAccountProps,
} from './avatar-account.types';

// TODO: This might not scale well with our new multichain initiative since it would require
// future account's type to be added here too. The best approach might be to use
// `InternalAccount` type rather than plain addresses. This way we could use the account's
// type to "infer" the namespace.
// For now, keep keep this simple.
function getJazziconNamespace(address: string): string | undefined {
  if (isBtcMainnetAddress(address) || isBtcTestnetAddress(address)) {
    // TODO: Add this to @metamask/utils `KnownCaipNamespaces` and use it here:
    return 'bip122';
  }
  // We leave it `undefined` to fallback to the default jazzicon behavior (even for
  // ethereum).
  return undefined;
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
