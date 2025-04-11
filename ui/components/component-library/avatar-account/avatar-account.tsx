import classnames from 'classnames';
import React from 'react';

import BlockieIdenticon from '../../ui/identicon/blockieIdenticon/blockieIdenticon.component';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import type { AvatarBaseProps } from '../avatar-base';
import { AvatarBase } from '../avatar-base';
import type { PolymorphicRef } from '../box';
import type {
  AvatarAccountComponent,
  AvatarAccountProps} from './avatar-account.types';
import {
  AvatarAccountDiameter,
  AvatarAccountVariant,
  AvatarAccountSize
} from './avatar-account.types';

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
