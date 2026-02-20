import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { Tag } from '../../../../component-library';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import {
  useMusdCtaVisibility,
  useMusdBalance,
} from '../../../../../hooks/musd';
import { MusdConvertLink } from '../../../musd';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellTitle = React.memo(
  ({ token }: TokenCellTitleProps) => {
    const label = token.accountType
      ? ACCOUNT_TYPE_LABELS[token.accountType]
      : undefined;

    // Use visibility hook to determine if mUSD CTA should show
    const { shouldShowTokenListItemCta } = useMusdCtaVisibility();
    const { hasMusdBalance } = useMusdBalance();

    // Compute visibility for this specific token
    const showMusdCta = useMemo(() => {
      if (!token.address || !token.chainId) {
        return false;
      }
      return shouldShowTokenListItemCta(
        {
          address: token.address as Hex,
          chainId: token.chainId as Hex,
          symbol: token.symbol,
        },
        { hasMusdBalance },
      );
    }, [
      token.address,
      token.chainId,
      token.symbol,
      shouldShowTokenListItemCta,
      hasMusdBalance,
    ]);

    return (
      <Box flexDirection={BoxFlexDirection.Row} className="min-w-0">
        <Box flexDirection={BoxFlexDirection.Row} gap={2} className="min-w-0">
          <AssetCellTitle title={token.title} />
          {label && <Tag label={label} />}
        </Box>
        {token.isStakeable && (
          <StakeableLink chainId={token.chainId} symbol={token.symbol} />
        )}
        {/* mUSD Convert CTA - shows for eligible stablecoins when user has mUSD */}
        {showMusdCta && (
          <MusdConvertLink
            tokenAddress={token.address as Hex}
            chainId={token.chainId as Hex}
            tokenSymbol={token.symbol}
            entryPoint="token_list"
          />
        )}
      </Box>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.title === nextProps.token.title &&
    prevProps.token.address === nextProps.token.address &&
    prevProps.token.chainId === nextProps.token.chainId &&
    prevProps.token.symbol === nextProps.token.symbol,
);
