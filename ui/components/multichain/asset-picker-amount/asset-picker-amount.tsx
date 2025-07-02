import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TokenListMap } from '@metamask/assets-controllers';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { CaipChainId } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  getCurrentNetwork,
  getIpfsGateway,
  getNativeCurrencyImage,
  getSelectedInternalAccount,
  getTokenList,
} from '../../../selectors';

import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  getCurrentDraftTransaction,
  getIsNativeSendPossible,
  getSendMaxModeState,
  type Amount,
  type Asset,
} from '../../../ducks/send';
import { NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR } from '../../../pages/confirmations/send/send.constants';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import useGetAssetImageUrl from '../../../hooks/useGetAssetImageUrl';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../shared/modules/selectors/networks';
import { setActiveNetworkWithError } from '../../../store/actions';
import { setToChainId } from '../../../ducks/bridge/actions';
import MaxClearButton from './max-clear-button';
import {
  AssetPicker,
  type AssetPickerProps,
} from './asset-picker/asset-picker';
import { SwappableCurrencyInput } from './swappable-currency-input/swappable-currency-input';
import { AssetBalance } from './asset-balance/asset-balance';

type AssetPickerAmountProps = OverridingUnion<
  AssetPickerProps,
  {
    // all of these props should be explicitly received
    asset: Asset;
    amount: Amount;
    isAmountLoading?: boolean;
    action?: 'send' | 'receive';
    disableMaxButton?: boolean;
    error?: string;
    showNetworkPicker?: boolean;
    /**
     * Callback for when the amount changes; disables the input when undefined
     */
    onAmountChange?: (
      newAmountRaw: string,
      newAmountFormatted?: string,
    ) => void;
  }
>;

type NetworkOption =
  | NetworkConfiguration
  | AddNetworkFields
  | (Omit<NetworkConfiguration, 'chainId'> & { chainId: CaipChainId });

// A component that combines an asset picker with an input for the amount to send.
export const AssetPickerAmount = ({
  asset,
  amount,
  onAmountChange,
  action,
  isAmountLoading,
  disableMaxButton = false,
  showNetworkPicker,
  error: passedError,
  ...assetPickerProps
}: AssetPickerAmountProps) => {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { swapQuotesError, sendAsset, receiveAsset } = useSelector(
    getCurrentDraftTransaction,
  );
  const isDisabled = !onAmountChange;
  const isSwapsErrorShown = isDisabled && swapQuotesError;

  const isMaxMode = useSelector(getSendMaxModeState);
  const isNativeSendPossible = useSelector(getIsNativeSendPossible);

  const currentChainId = useSelector(getCurrentChainId);
  const nativeCurrencySymbol = useSelector(getNativeCurrency);
  const nativeCurrencyImageUrl = useSelector(getNativeCurrencyImage);
  const tokenList = useSelector(getTokenList) as TokenListMap;

  const ipfsGateway = useSelector(getIpfsGateway);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const showNetworkPickerinModal = process.env.REMOVE_GNS && showNetworkPicker;
  const currentNetwork = useSelector(getCurrentNetwork);
  useEffect(() => {
    // if this input is immutable – avoids double fire
    if (isDisabled) {
      return;
    }

    // if native send is not possible
    if (isNativeSendPossible) {
      return;
    }

    // if max mode already enabled
    if (!isMaxMode) {
      return;
    }

    // disable max mode and replace with "0"
    onAmountChange('0x0');
  }, [isDisabled, isMaxMode, isNativeSendPossible, onAmountChange]);

  const [isFocused, setIsFocused] = useState(false);
  const [isNFTInputChanged, setIsTokenInputChanged] = useState(false);
  const nftImageURL = useGetAssetImageUrl(
    asset?.details?.image ?? undefined,
    ipfsGateway,
  );

  const handleChange = useCallback(
    (newAmountRaw, newAmountFormatted) => {
      if (!isNFTInputChanged && asset.type === AssetType.NFT) {
        setIsTokenInputChanged(true);
      }
      onAmountChange?.(newAmountRaw, newAmountFormatted);
    },
    [onAmountChange, isNFTInputChanged, asset.type],
  );

  useEffect(() => {
    setIsTokenInputChanged(false);
  }, [asset]);

  const { error: rawError } = amount;

  // if input hasn't been touched, don't show the zero amount error
  const isLowBalanceErrorInvalid =
    rawError === NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR &&
    asset.type === AssetType.NFT &&
    !isNFTInputChanged;

  const error = rawError && !isLowBalanceErrorInvalid ? rawError : undefined;

  useEffect(() => {
    if (!asset) {
      throw new Error('No asset is drafted for sending');
    }
  }, [asset, selectedAccount]);

  let borderColor = BorderColor.borderMuted;

  if (isDisabled) {
    // if disabled, do not show source-side border colors
    if (isSwapsErrorShown) {
      borderColor = BorderColor.errorDefault;
    }
  } else if (error) {
    borderColor = BorderColor.errorDefault;
  } else if (isFocused) {
    borderColor = BorderColor.primaryDefault;
  }

  const isSwapAndSendFromNative =
    sendAsset.type === AssetType.native &&
    receiveAsset.type !== AssetType.native;

  let standardizedAsset;
  if (asset?.type === AssetType.native) {
    standardizedAsset = {
      type: asset.type,
      image: nativeCurrencyImageUrl,
      symbol: nativeCurrencySymbol as string,
      chainId: currentChainId,
    };
  } else if (asset?.type === AssetType.token && asset?.details?.symbol) {
    standardizedAsset = {
      type: asset.type,
      image:
        nftImageURL ||
        (tokenList &&
          asset.details?.address &&
          tokenList[asset.details.address.toLowerCase()]?.iconUrl),
      symbol: asset.details.symbol,
      address: asset.details.address,
      chainId: currentChainId,
    };
  } else if (
    asset?.type === AssetType.NFT &&
    asset?.details?.tokenId !== undefined &&
    asset?.details?.image
  ) {
    standardizedAsset = {
      type: asset.type as AssetType.NFT,
      tokenId: asset.details.tokenId,
      image: asset.details.image,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      symbol: (asset.details.symbol || asset.details.name) ?? undefined,
      address: asset.details.address,
    };
  }

  return (
    <Box className="asset-picker-amount">
      <Box
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        display={Display.Flex}
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.LG}
        borderColor={borderColor}
        borderStyle={BorderStyle.solid}
        borderWidth={1}
        marginBottom={1}
        padding={1}
        // apply extra padding if there isn't an input component to apply it
        paddingTop={asset.details?.standard === TokenStandard.ERC721 ? 4 : 1}
        paddingBottom={asset.details?.standard === TokenStandard.ERC721 ? 4 : 1}
      >
        <AssetPicker
          action={action}
          asset={standardizedAsset}
          networkProps={
            showNetworkPickerinModal
              ? {
                  network: currentNetwork as unknown as NetworkOption,
                  networks: Object.values(allNetworks) as NetworkOption[],
                  onNetworkChange: (networkConfig) => {
                    const rpcEndpoint =
                      networkConfig.rpcEndpoints[
                        networkConfig.defaultRpcEndpointIndex
                      ];
                    dispatch(setToChainId(networkConfig.chainId));
                    dispatch(
                      setActiveNetworkWithError(
                        'networkClientId' in rpcEndpoint
                          ? rpcEndpoint.networkClientId
                          : networkConfig.chainId,
                      ),
                    );
                  },
                  header: t('yourNetworks'),
                }
              : undefined
          }
          {...assetPickerProps}
        />
        <SwappableCurrencyInput
          onAmountChange={onAmountChange ? handleChange : undefined}
          assetType={asset.type}
          asset={asset}
          amount={amount}
          isAmountLoading={isAmountLoading}
        />
      </Box>
      <Box display={Display.Flex}>
        {/* Only show balance if mutable */}
        {onAmountChange && (
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          <AssetBalance asset={asset} error={passedError || error} />
        )}
        {isSwapsErrorShown && (
          <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
            {t(swapQuotesError)}
          </Text>
        )}
        {/* The fiat value will always leave dust and is often inaccurate anyways */}
        {onAmountChange &&
          isNativeSendPossible &&
          !isSwapAndSendFromNative &&
          !disableMaxButton && <MaxClearButton asset={asset} />}
      </Box>
    </Box>
  );
};
