// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { Box } from '../../../../component-library';
import { getMarketData } from '../../../../../selectors';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { TokenFiatDisplayInfo } from '../../types';
import { PercentageChange } from '../../../../multichain/token-list-item/price/percentage-change';

type TokenCellPercentChangeProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellPercentChange = React.memo(
  ({ token }: TokenCellPercentChangeProps) => {
    const isEvm = useSelector(getMultichainIsEvm);
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

    // we don't support non-evm price changes yet.
    // annoyingly, we need an empty component here for flexbox to align everything nicely
    return <Box></Box>;
  },
  (prevProps, nextProps) => prevProps.token.address === nextProps.token.address,
);
