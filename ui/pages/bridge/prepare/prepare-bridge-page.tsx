import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ProviderConfig } from '@metamask/network-controller';
import {
  setFromChain,
  setFromToken,
  setFromTokenInputValue,
  setToChain,
  setToToken,
} from '../../../ducks/bridge/actions';
import {
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getFromTokens,
  getFromTopAssets,
  getToAmount,
  getToChain,
  getToChains,
  getToToken,
  getToTokens,
  getToTopAssets,
} from '../../../ducks/bridge/selectors';
import { MultiChainTokenPicker } from '../components/multichain-token-picker';
import { Box, Text, TextField } from '../../../components/component-library';
import {
  BlockSize,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TokenBucketPriority } from '../../../../shared/constants/swaps';
import { RPCDefinition } from '../../../../shared/constants/network';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getFromTokens);
  const fromTopAssets = useSelector(getFromTopAssets);

  const toToken = useSelector(getToToken);
  const toTokens = useSelector(getToTokens);
  const toTopAssets = useSelector(getToTopAssets);

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const toAmount = useSelector(getToAmount);

  return (
    <div className="prepare-bridge-page">
      <Box
        className="prepare-bridge-page__content"
        width={BlockSize.Full}
        flexDirection={FlexDirection.Column}
      >
        <Box
          className="from-input"
          width={BlockSize.Full}
          flexDirection={FlexDirection.Row}
        >
          <Text>{t('bridgeFrom')}</Text>
          {`${fromChain?.chainId}:${fromToken?.symbol} ${fromAmount}`}
          <MultiChainTokenPicker
            selectedNetwork={fromChain}
            selectedToken={fromToken}
            networks={fromChains}
            tokens={fromTokens}
            topAssets={fromTopAssets}
            sortOrder={TokenBucketPriority.owned}
            onTokenChange={(token) => dispatch(setFromToken(token))}
            onNetworkChange={(networkConfig) => {
              dispatch(setFromChain(networkConfig));
              // TODO emit metric
            }}
          />
          <TextField
            value={fromAmount}
            onChange={(e) => {
              // TODO validate input
              dispatch(setFromTokenInputValue(e.target.value));
            }}
          />
        </Box>

        <Box
          className="to-input"
          width={BlockSize.Full}
          flexDirection={FlexDirection.Row}
        >
          <Text>{t('bridgeTo')}</Text>
          {`${toChain?.chainId}:${toToken?.symbol} ${toAmount}`}
          <MultiChainTokenPicker
            selectedNetwork={toChain}
            selectedToken={toToken}
            networks={toChains}
            sortOrder={TokenBucketPriority.top}
            onTokenChange={(token) => dispatch(setToToken(token))}
            onNetworkChange={(
              networkConfig: ProviderConfig | RPCDefinition,
            ) => {
              dispatch(setToChain(networkConfig));
            }}
            tokens={toTokens ?? {}}
            topAssets={toTopAssets ?? []}
          />
          <TextField value={toAmount} readOnly />
        </Box>
      </Box>
    </div>
  );
};

export default PrepareBridgePage;
