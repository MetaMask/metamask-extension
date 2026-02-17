import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { Tag } from '../../../../component-library';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import {
  useMusdCtaVisibility,
  useMusdBalance,
} from '../../../../../hooks/musd';
import { MusdConvertLink } from '../../../musd-cta';
///: END:ONLY_INCLUDE_IF

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellTitle = React.memo(
  ({ token }: TokenCellTitleProps) => {
    const label = token.accountType
      ? ACCOUNT_TYPE_LABELS[token.accountType]
      : undefined;

    ///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
    // Use visibility hook to determine if mUSD CTA should show
    const { shouldShowTokenListItemCta } = useMusdCtaVisibility();
    const { hasMusdBalance } = useMusdBalance();

    // Compute visibility for this specific token
    const showMusdCta = useMemo(() => {
      console.log('[MUSD TokenCell Debug] Computing visibility for', {
        symbol: token.symbol,
        chainId: token.chainId,
        address: token.address?.slice(0, 10),
        hasMusdBalance,
      });
      if (!token.address || !token.chainId) {
        console.log('[MUSD TokenCell Debug] No address/chainId, skipping');
        return false;
      }
      const result = shouldShowTokenListItemCta(
        {
          address: token.address as Hex,
          chainId: token.chainId as Hex,
          symbol: token.symbol,
        },
        { hasMusdBalance },
      );
      console.log('[MUSD TokenCell Debug] Result:', result);
      return result;
    }, [
      token.address,
      token.chainId,
      token.symbol,
      shouldShowTokenListItemCta,
      hasMusdBalance,
    ]);
    ///: END:ONLY_INCLUDE_IF

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
        {
          ///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
          showMusdCta && (
            <MusdConvertLink
              tokenAddress={token.address as Hex}
              chainId={token.chainId as Hex}
              tokenSymbol={token.symbol}
              entryPoint="token_list"
            />
          )
          ///: END:ONLY_INCLUDE_IF
        }
      </Box>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.title === nextProps.token.title &&
    prevProps.token.address === nextProps.token.address &&
    prevProps.token.chainId === nextProps.token.chainId &&
    prevProps.token.symbol === nextProps.token.symbol,
);
