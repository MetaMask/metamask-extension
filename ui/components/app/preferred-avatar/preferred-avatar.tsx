import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountProps,
  AvatarAccountVariant,
  AvatarBaseShape,
} from '@metamask/design-system-react';
import type { MetaMaskReduxState } from '../../../store/store';

/**
 * Renders an avatar for an address based on the user's settings. This wraps AvatarAccount.
 *
 * @param props - Props to pass to AvatarAccount
 */
export const PreferredAvatar = (props: Omit<AvatarAccountProps, 'ref'>) => {
  const variant = useSelector(getUseBlockie)
    ? AvatarAccountVariant.Blockies
    : AvatarAccountVariant.Jazzicon;

  return (
    <AvatarAccount
      {...props}
      variant={variant}
      shape={AvatarBaseShape.Circle} // Remove once we switch to Maskicon
    />
  );
};

// Inlining to avoid having to import the selectors barrel file and cause
// circular dependencies in certain situations. This will be revised once
// we switch to Maskicon.
function getUseBlockie(state: MetaMaskReduxState) {
  return state.metamask.useBlockie;
}
