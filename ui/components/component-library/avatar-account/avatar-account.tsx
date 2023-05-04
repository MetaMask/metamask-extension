import React, { forwardRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import BlockieIdenticon from '../../ui/identicon/blockieIdenticon/blockieIdenticon.component';

import Box, { BoxProps } from '../../ui/box/box';

import { AvatarBase } from '../avatar-base';
import {
  AvatarAccountDiameter,
  AvatarAccountVariant,
  AvatarAccountSize,
} from './avatar-account.types';

export interface AvatarAccountProps extends BoxProps {
  size?: AvatarAccountSize;
  address: string;
  variant?: AvatarAccountVariant;
}

export const AvatarAccount = forwardRef<HTMLDivElement, AvatarAccountProps>(
  (
    {
      size = AvatarAccountSize.Md,
      address,
      className,
      variant = AvatarAccountVariant.Jazzicon,
      ...props
    },
    ref,
  ) => (
    <AvatarBase
      ref={ref}
      size={size}
      className={classnames('mm-avatar-account', className)}
      {...props}
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

AvatarAccount.propTypes = {
  size: PropTypes.oneOf(Object.values(AvatarAccountSize)),
  variant: PropTypes.oneOf(Object.values(AvatarAccountVariant)),
  address: PropTypes.string.isRequired,
  className: PropTypes.string,
  ...Box.propTypes,
};

AvatarAccount.displayName = 'AvatarAccount';
