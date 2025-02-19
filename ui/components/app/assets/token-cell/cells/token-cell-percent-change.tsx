import React from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Text } from '../../../../component-library';
import { getMarketData } from '../../../../../selectors';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TokenFiatDisplayInfo } from '../../types';
import { PercentageChange } from '../../../../multichain/token-list-item/price/percentage-change';
import {
  TranslateFunction,
  networkTitleOverrides,
} from '../../util/networkTitleOverrides';

type TokenCellPercentChangeProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellPercentChange = React.memo(
  ({ token }: TokenCellPercentChangeProps) => {
    const isEvm = useSelector(getMultichainIsEvm);
    const t = useI18nContext();
    const multiChainMarketData = useSelector(getMarketData);

    // We do not want to display any percentage with non-EVM since we don't have the data for this yet.
    if (isEvm) {
      const tokenPercentageChange = token.address
        ? multiChainMarketData?.[token.chainId]?.[token.address]
            ?.pricePercentChange1d
        : null;

      return (
        <PercentageChange
          value={
            token.isNative
              ? multiChainMarketData?.[token.chainId]?.[
                  getNativeTokenAddress(token.chainId as Hex)
                ]?.pricePercentChange1d
              : tokenPercentageChange
          }
          address={
            token.isNative
              ? getNativeTokenAddress(token.chainId as Hex)
              : (token.address as `0x${string}`)
          }
        />
      );
    }

    // fallback value (is this valid?)
    return (
      <Text
        variant={TextVariant.bodySmMedium}
        color={TextColor.textAlternative}
        data-testid="multichain-token-list-item-token-name"
        ellipsis
      >
        {networkTitleOverrides(t as TranslateFunction, token)}
      </Text>
    );
  },
  (prevProps, nextProps) => prevProps.token.address === nextProps.token.address,
);
