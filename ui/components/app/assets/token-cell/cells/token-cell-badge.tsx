import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
} from '../../../../component-library';
import { getNativeCurrencyForChain } from '../../../../../selectors';
import {
  getImageForChainId,
  getMultichainIsEvm,
} from '../../../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { TokenFiatDisplayInfo } from '../../types';

type TokenCellBadgeProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellBadge = React.memo(
  ({ token }: TokenCellBadgeProps) => {
    const isEvm = useSelector(getMultichainIsEvm);
    const allNetworks = useSelector(getNetworkConfigurationsByChainId);

    return (
      <BadgeWrapper
        badge={
          <AvatarNetwork
            size={AvatarNetworkSize.Xs}
            name={allNetworks?.[token.chainId as Hex]?.name}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            src={getImageForChainId(token.chainId) || undefined}
            backgroundColor={BackgroundColor.backgroundMuted}
            borderWidth={2}
          />
        }
        marginRight={4}
        style={{ alignSelf: 'center' }}
      >
        <AvatarToken
          name={token.symbol}
          backgroundColor={BackgroundColor.backgroundMuted}
          src={
            isEvm && token.isNative
              ? getNativeCurrencyForChain(token.chainId)
              : token.tokenImage
          }
        />
      </BadgeWrapper>
    );
  },
  (prevProps, nextProps) => prevProps.token.chainId === nextProps.token.chainId,
);
