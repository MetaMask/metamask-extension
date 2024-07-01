import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
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
  getToAmount,
  getToChain,
  getToChains,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { MultiChainTokenPicker } from '../components/multichain-token-picker';
import { Box, TextField } from '../../../components/component-library';
import {
  BlockSize,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { setActiveNetwork } from '../../../store/actions';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

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
          {`BRIDGE FROM ${fromChain?.chainId}:${fromToken?.symbol} ${fromAmount}`}
          <MultiChainTokenPicker
            selectedNetwork={fromChain}
            selectedToken={fromToken}
            networks={fromChains}
            onTokenChange={(token) => dispatch(setFromToken(token))}
            onNetworkChange={({ chainId, id }) => {
              dispatch(setActiveNetwork(id));
              // TODO emit metric
              // trackEvent({
              //   event: MetaMetricsEventName.NavNetworkSwitched,
              //   category: MetaMetricsEventCategory.Network,
              //   properties: {
              //     location: 'Network Menu',
              //     chain_id: currentChainId,
              //     from_network: currentChainId,
              //     to_network: network.chainId,
              //   },
              // });
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
          {`BRIDGE TO ${toChain?.chainId}:${toToken?.symbol} ${toAmount}`}
          <MultiChainTokenPicker
            selectedNetwork={toChain}
            selectedToken={toToken}
            networks={toChains}
            onTokenChange={(token) => dispatch(setToToken(token))}
            onNetworkChange={(networkConfig) => {
              dispatch(setToChain(networkConfig));
              console.log('TODO implement bridge action for this');
              // TODO refresh token list if it doesnt happen automatically
            }}
          />
          <TextField value={toAmount} readOnly />
        </Box>
      </Box>
    </div>
  );
};

export default PrepareBridgePage;
