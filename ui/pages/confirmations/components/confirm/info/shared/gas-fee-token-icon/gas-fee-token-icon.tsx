import React from 'react';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { useConfirmContext } from '../../../../../context/confirm';
import { selectNetworkConfigurationByChainId } from '../../../../../../../selectors';
import Identicon from '../../../../../../../components/ui/identicon';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../../../../shared/constants/network';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
} from '../../../../../../../components/component-library';
import { BackgroundColor } from '../../../../../../../helpers/constants/design-system';

export enum GasFeeTokenIconSize {
  Sm = 'sm',
  Md = 'md',
}

export function GasFeeTokenIcon({
  size = GasFeeTokenIconSize.Md,
  tokenAddress,
}: {
  size?: GasFeeTokenIconSize;
  tokenAddress: Hex;
}) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId } = currentConfirmation;

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  if (tokenAddress !== NATIVE_TOKEN_ADDRESS) {
    return (
      <Box data-testid="token-icon">
        <Identicon
          address={tokenAddress}
          diameter={size === GasFeeTokenIconSize.Md ? 32 : 12}
        />
      </Box>
    );
  }

  const { nativeCurrency } = networkConfiguration;

  const source =
    CHAIN_ID_TOKEN_IMAGE_MAP[chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP];

  return (
    <Box data-testid="native-icon">
      <AvatarToken
        src={source}
        name={nativeCurrency}
        size={
          size === GasFeeTokenIconSize.Md
            ? AvatarTokenSize.Md
            : AvatarTokenSize.Xs
        }
        backgroundColor={BackgroundColor.backgroundDefault}
      />
    </Box>
  );
}
