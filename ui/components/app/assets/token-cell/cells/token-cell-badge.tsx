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
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { TokenFiatDisplayInfo } from '../../types';

type TokenCellBadgeProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellBadge = React.memo(
  ({ token }: TokenCellBadgeProps) => {
    const allNetworks = useSelector(getNetworkConfigurationsByChainId);

    return (
      <BadgeWrapper
        badge={
          <AvatarNetwork
            size={AvatarNetworkSize.Xs}
            name={allNetworks?.[token.chainId as Hex]?.name}
            src={getImageForChainId(token.chainId) || undefined}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
        marginRight={4}
      >
        <AvatarToken
          name={token.symbol}
          src={
            token.isNative
              ? getNativeCurrencyForChain(token.chainId)
              : token.tokenImage
          }
        />
      </BadgeWrapper>
    );
  },
  (prevProps, nextProps) => prevProps.token.chainId === nextProps.token.chainId,
);
