import React, { useCallback, useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import { BigNumber } from 'bignumber.js';
import { AssetType, isSolanaChainId } from '@metamask/bridge-controller';
import { useIntentSourceAmounts } from '../../../hooks/transactions/useIntentSourceAmount';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { selectNetworkConfigurationByChainId } from '../../../../../selectors';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../helpers/constants/intents';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import Preloader from '../../../../../components/ui/icon/preloader';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { getFromChains } from '../../../../../ducks/bridge/selectors';
import { AssetPicker } from '../../../../../components/multichain/asset-picker-amount/asset-picker';
import { TabName } from '../../../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';
import { useMultichainBalances } from '../../../../../hooks/useMultichainBalances';
import { useIntentsContext } from '../../../context/intents/intents';
import { TokenPill } from '../../confirm/token-pill/token-pill';

export type SelectedToken = {
  address?: Hex;
  chainId?: Hex;
};

export function IntentsSourceRow() {
  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const { sourceToken, setSourceToken, loading, success } = useIntentsContext();
  const sourceAmounts = useIntentSourceAmounts();

  const sourceTokenChainId = sourceToken?.chainId;
  const sourceTokenAddress = sourceToken?.address;

  const sourceTokenMetadata = multichainTokensWithBalance.find(
    (token) =>
      token.chainId === sourceTokenChainId &&
      (token.address || NATIVE_TOKEN_ADDRESS).toLowerCase() ===
        sourceTokenAddress?.toLowerCase(),
  );

  const asset = {
    address: sourceTokenAddress,
    chainId: sourceTokenChainId,
    image: sourceTokenMetadata?.image,
    type:
      sourceTokenAddress === NATIVE_TOKEN_ADDRESS
        ? AssetType.native
        : AssetType.token,
    symbol: sourceTokenMetadata?.symbol,
  };

  const defaultNetwork = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, sourceTokenChainId),
  );

  const [network, setNetwork] = useState<NetworkConfiguration>();

  useEffect(() => {
    if (defaultNetwork && !network) {
      setNetwork(defaultNetwork);
    }
  }, [defaultNetwork, network]);

  const sourceAmountTotal = sourceAmounts
    ?.reduce(
      (acc, amount) =>
        acc.plus(new BigNumber(amount.sourceTokenAmountFormatted)),
      new BigNumber(0),
    )
    .round(6)
    .toString();

  const sourceAmountFiatFormatted = useTokenFiatAmount(
    sourceTokenAddress,
    sourceAmountTotal,
    undefined,
    {},
    true,
    sourceTokenChainId,
  );

  const sourceAmountFiat = useTokenFiatAmount(
    sourceTokenAddress,
    sourceAmountTotal,
    undefined,
    {},
    true,
    sourceTokenChainId,
    false,
  );

  if (!sourceAmounts?.length || !sourceTokenChainId || !sourceTokenAddress) {
    return null;
  }

  return (
    <ConfirmInfoRow label="Pay">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        gap={2}
      >
        {loading && (
          <div role="progressbar">
            <Preloader size={20} />
          </div>
        )}
        {!loading && success && (
          <Icon name={IconName.CheckBold} size={IconSize.Sm} />
        )}
        {!loading && !success && (
          <Icon name={IconName.Warning} size={IconSize.Sm} />
        )}
        <Text>{sourceAmountFiatFormatted}</Text>
        <Text>{sourceAmountTotal}</Text>
        <AssetPickerWrapper
          asset={asset as never}
          network={network as never}
          onAssetChange={(newAsset) =>
            setSourceToken?.({
              chainId: newAsset.chainId as Hex,
              address: (newAsset.address as Hex) || NATIVE_TOKEN_ADDRESS,
            })
          }
          onNetworkChange={(newNetwork) => setNetwork(newNetwork)}
          sourceAmountFiat={sourceAmountFiat}
        />
      </Box>
    </ConfirmInfoRow>
  );
}

function AssetPickerWrapper({
  asset,
  network,
  onAssetChange,
  onNetworkChange,
  sourceAmountFiat,
}: {
  asset: AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>;
  network: NetworkConfiguration;
  onAssetChange: (
    asset: AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>,
  ) => void;
  onNetworkChange: (network: NetworkConfiguration) => void;
  sourceAmountFiat?: string;
}) {
  const supportedChains = useSelector(getFromChains).filter(
    ({ chainId }) => !isSolanaChainId(chainId),
  );

  const sourceAmountFiatNumber = new BigNumber(
    sourceAmountFiat ?? '0',
  ).toNumber();

  const tokenFilter = useCallback(
    (token) => token.fiatBalance >= sourceAmountFiatNumber,
    [sourceAmountFiatNumber],
  );

  return (
    <AssetPicker
      asset={asset}
      header="Select token"
      isMultiselectEnabled={true}
      visibleTabs={[TabName.TOKENS]}
      onAssetChange={onAssetChange}
      networkProps={{
        network,
        networks: supportedChains,
        onNetworkChange: (_network) =>
          onNetworkChange(_network as NetworkConfiguration),
      }}
      tokenFilter={tokenFilter}
    >
      {(onClickHandler) => (
        <TokenPill
          chainId={asset.chainId as Hex}
          tokenAddress={asset.address as Hex}
          onClick={onClickHandler}
        />
      )}
    </AssetPicker>
  );
}
