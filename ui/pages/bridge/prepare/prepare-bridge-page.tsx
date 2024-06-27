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
import {
  Box,
  ButtonIcon,
  IconName,
  TextField,
} from '../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TokenBucketPriority } from '../../../../shared/constants/swaps';
import { RPCDefinition } from '../../../../shared/constants/network';
import { TabName } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { AssetPicker } from '../../../components/multichain/asset-picker-amount/asset-picker';
import { useTokensWithFiltering } from '../../../hooks/useTokensWithFiltering';

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

  const fromTokenListGenerator = useTokensWithFiltering(
    fromTokens,
    fromTopAssets,
    fromChain?.chainId,
    TokenBucketPriority.owned,
  );
  const toTokenListGenerator = useTokensWithFiltering(
    toTokens ?? fromTokens,
    toTopAssets ?? fromTopAssets,
    toChain?.chainId ?? fromChain?.chainId,
    TokenBucketPriority.top,
  );

  return (
    <div className="prepare-bridge-page">
      <Box
        className="prepare-bridge-page__content"
        width={BlockSize.Full}
        flexDirection={FlexDirection.Column}
        borderWidth={1}
        borderRadius={BorderRadius.LG}
      >
        <Box
          className="from-input"
          width={BlockSize.Full}
          flexDirection={FlexDirection.Row}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
        >
          <AssetPicker
            header={t('bridgeFrom')}
            visibleTabs={[TabName.TOKENS]}
            asset={fromToken}
            onAssetChange={(token) => dispatch(setFromToken(token))}
            networkProps={{
              network: fromChain,
              networks: fromChains,
              onNetworkChange: (networkConfig) => {
                dispatch(setFromChain(networkConfig));
                // TODO emit metric
              },
            }}
            filteredTokensGenerator={
              fromTokens && fromTopAssets ? fromTokenListGenerator : undefined
            }
          />
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <TextField
              testId="from-amount"
              value={fromAmount}
              onChange={(e) => {
                // TODO validate input
                dispatch(setFromTokenInputValue(e.target.value));
              }}
            />
          </Box>
        </Box>

        <ButtonIcon
          data-testid="switch-tokens"
          ariaLabel="switch-tokens"
          iconName={IconName.Arrow2Down}
          disabled={toChain === null}
          onClick={() => {
            // TODO rotate animation
            toChain && dispatch(setFromChain(toChain));
            dispatch(setToChain(fromChain));
            dispatch(setFromTokenInputValue(null));
            dispatch(setFromToken(toToken));
            dispatch(setToToken(fromToken));
          }}
        />

        <Box
          className="to-input"
          width={BlockSize.Full}
          flexDirection={FlexDirection.Row}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
        >
          <AssetPicker
            header={t('bridgeTo')}
            visibleTabs={[TabName.TOKENS]}
            asset={toToken}
            onAssetChange={(token) => {
              dispatch(setToToken(token));
            }}
            networkProps={{
              network: toChain ?? fromChain,
              networks: toChains,
              onNetworkChange: (
                networkConfig: ProviderConfig | RPCDefinition,
              ) => {
                dispatch(setToChain(networkConfig));
              },
            }}
            filteredTokensGenerator={
              toTokens && toTopAssets ? toTokenListGenerator : undefined
            }
          />
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <TextField testId="to-amount" value={toAmount} readOnly />
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default PrepareBridgePage;
