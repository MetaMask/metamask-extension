import { AvatarAccountSize } from '@metamask/design-system-react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../../../../shared/constants/network';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { PreferredAvatar } from '../../../../../../../components/app/preferred-avatar';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
} from '../../../../../../../components/component-library';
import Identicon from '../../../../../../../components/ui/identicon';
import { BackgroundColor } from '../../../../../../../helpers/constants/design-system';
import {
  selectERC20TokensByChain,
  selectNetworkConfigurationByChainId,
} from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';

export enum GasFeeTokenIconSize {
  Sm = 'sm',
  Md = 'md',
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const variation = chainId;
  const { iconUrl: image } =
    erc20TokensByChain?.[variation]?.data?.[tokenAddress] ?? {};

  if (tokenAddress !== NATIVE_TOKEN_ADDRESS) {
    return (
      <Box data-testid="token-icon">
        {image ? (
          <Identicon
            address={tokenAddress}
            diameter={size === GasFeeTokenIconSize.Md ? 32 : 12}
            image={image}
          />
        ) : (
          <PreferredAvatar
            address={tokenAddress}
            size={
              size === GasFeeTokenIconSize.Md
                ? AvatarAccountSize.Md
                : AvatarAccountSize.Xs
            }
          />
        )}
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
