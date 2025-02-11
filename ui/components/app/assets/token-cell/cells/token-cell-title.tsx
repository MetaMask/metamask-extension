import React from 'react';
import {
  FontWeight,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Text } from '../../../../component-library';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import {
  TranslateFunction,
  networkTitleOverrides,
} from '../../util/networkTitleOverrides';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellTitle = ({ token }: TokenCellTitleProps) => {
  const t = useI18nContext();

  // non-ellipsized title
  return (
    <Text fontWeight={FontWeight.Medium} variant={TextVariant.bodyMd} ellipsis>
      {networkTitleOverrides(t as TranslateFunction, token)}
      {token.isStakeable && (
        <StakeableLink chainId={token.chainId} symbol={token.symbol} />
      )}
    </Text>
  );
};
