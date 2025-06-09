import React from 'react';
import {
  Display,
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
import Tooltip from '../../../../ui/tooltip';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellTitle = React.memo(
  ({ token }: TokenCellTitleProps) => {
    const t = useI18nContext();

    if (token.title.length > 12) {
      return (
        <Tooltip
          position="bottom"
          html={token.title}
          wrapperClassName="token-cell-title--ellipsis"
        >
          <Text
            as="span"
            fontWeight={FontWeight.Medium}
            variant={TextVariant.bodyMd}
            display={Display.Block}
            ellipsis
          >
            {networkTitleOverrides(t as TranslateFunction, token)}
            {token.isStakeable && (
              <StakeableLink chainId={token.chainId} symbol={token.symbol} />
            )}
          </Text>
        </Tooltip>
      );
    }

    // non-ellipsized title
    return (
      <Text
        fontWeight={FontWeight.Medium}
        variant={TextVariant.bodyMd}
        ellipsis
      >
        {networkTitleOverrides(t as TranslateFunction, token)}
        {token.isStakeable && (
          <StakeableLink chainId={token.chainId} symbol={token.symbol} />
        )}
      </Text>
    );
  },
  (prevProps, nextProps) => prevProps.token.title === nextProps.token.title, // Only rerender if the title changes
);
