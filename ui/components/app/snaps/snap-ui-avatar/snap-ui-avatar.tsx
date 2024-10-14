import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CaipAccountId, parseCaipAccountId } from '@metamask/utils';
import BlockieIdenticon from '../../../ui/identicon/blockieIdenticon';
import Jazzicon from '../../../ui/jazzicon';
import { getUseBlockie } from '../../../../selectors';

export const DIAMETERS: Record<string, number> = {
  'xs': 16,
  'sm': 24,
  'md': 32,
  'lg': 40,
};

export type SnapUIAvatarProps = {
  // The address must be a CAIP-10 string.
  address: string;
  size?: string;
};

export const SnapUIAvatar: React.FunctionComponent<SnapUIAvatarProps> = ({
  address,
  size = 'md',
}) => {
  const parsed = useMemo(() => {
    return parseCaipAccountId(address as CaipAccountId);
  }, [address]);
  const useBlockie = useSelector(getUseBlockie);

  return useBlockie ? (
    <BlockieIdenticon
      address={parsed.address}
      diameter={DIAMETERS[size]}
      borderRadius="50%"
    />
  ) : (
    <Jazzicon
      namespace={parsed.chain.namespace}
      address={parsed.address}
      diameter={DIAMETERS[size]}
      style={{ display: 'flex' }}
    />
  );
};
