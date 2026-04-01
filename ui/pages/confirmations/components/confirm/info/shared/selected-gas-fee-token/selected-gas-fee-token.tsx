import React, { useCallback, useMemo, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
} from '../../../../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../../../../context/confirm';
import { useDappSwapContext } from '../../../../../context/dapp-swap';
import { getNetworkConfigurationsByChainId } from '../../../../../../../../shared/lib/selectors/networks';
import { GasFeeTokenModal } from '../gas-fee-token-modal';
import { useSelectedGasFeeToken } from '../../hooks/useGasFeeToken';
import { GasFeeTokenIcon, GasFeeTokenIconSize } from '../gas-fee-token-icon';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useIsInsufficientBalance } from '../../../../../hooks/useIsInsufficientBalance';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../../../../../../shared/constants/network';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SelectedGasFeeToken() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { isQuotedSwapDisplayedInInfo } = useDappSwapContext();
  const { chainId, gasFeeTokens, excludeNativeTokenForFee } =
    currentConfirmation;

  const { isSupported: isGaslessSupported, isSmartTransaction } =
    useIsGaslessSupported();

  const hasInsufficientNative = useIsInsufficientBalance();

  const hasOnlyFutureNativeToken =
    gasFeeTokens?.length === 1 &&
    gasFeeTokens[0].tokenAddress === NATIVE_TOKEN_ADDRESS;

  const supportsFutureNative = hasInsufficientNative && isSmartTransaction;

  const hasGasFeeTokens =
    !isQuotedSwapDisplayedInInfo &&
    isGaslessSupported &&
    Boolean(gasFeeTokens?.length) &&
    (!hasOnlyFutureNativeToken || supportsFutureNative);

  const nonNativeGasFeeTokensLength = useMemo(() => {
    return (
      gasFeeTokens?.filter(
        (token) =>
          token.tokenAddress && token.tokenAddress !== NATIVE_TOKEN_ADDRESS,
      ) ?? []
    ).length;
  }, [gasFeeTokens]);
  // If we decide the exclude the native token, check that gasFeeTokens has at least two items.
  // Otherwise the native token is always an extra item.
  const hasMoreThanOneGasFeeTokenToChooseFrom = excludeNativeTokenForFee
    ? hasGasFeeTokens && nonNativeGasFeeTokensLength > 1
    : hasGasFeeTokens;

  const networkConfiguration = useSelector(getNetworkConfigurationsByChainId)?.[
    chainId
  ];

  const handleClick = useCallback(() => {
    if (!hasMoreThanOneGasFeeTokenToChooseFrom) {
      return;
    }

    setIsModalOpen(true);
  }, [hasMoreThanOneGasFeeTokenToChooseFrom]);

  const nativeTicker = networkConfiguration?.nativeCurrency;
  const gasFeeToken = useSelectedGasFeeToken();

  const { gasTokenAddress, gasTokenSymbol } = useMemo(() => {
    // For chains with no native token (signaled by `excludeNativeTokenForFee`):
    // - We may set the symbol of a default fee token the chain config (ex: pathUSD).
    // - We may set the address of a default fee token in the assets-controllers config (ex: 0x20c0000000000000000000000000000000000000)
    // If one of them is not set, falling back to original behavior.
    if (nonNativeGasFeeTokensLength === 0 && excludeNativeTokenForFee) {
      const localConfigSymbol =
        CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
          chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
        ];
      const assetsControllerNativeTokenAddress = getNativeTokenAddress(chainId);
      if (localConfigSymbol && assetsControllerNativeTokenAddress) {
        return {
          gasTokenSymbol: localConfigSymbol,
          gasTokenAddress: assetsControllerNativeTokenAddress,
        };
      }
    }
    // Original behavior (most chains)
    const symbol = gasFeeToken?.symbol ?? nativeTicker;
    const address = gasFeeToken?.tokenAddress ?? NATIVE_TOKEN_ADDRESS;
    return {
      gasTokenSymbol: symbol,
      gasTokenAddress: address,
    };
  }, [
    gasFeeToken,
    nativeTicker,
    chainId,
    excludeNativeTokenForFee,
    nonNativeGasFeeTokensLength,
  ]);

  return (
    <>
      {isModalOpen && (
        <GasFeeTokenModal onClose={() => setIsModalOpen(false)} />
      )}
      <Box
        data-testid="selected-gas-fee-token"
        onClick={handleClick}
        backgroundColor={
          hasMoreThanOneGasFeeTokenToChooseFrom
            ? BackgroundColor.backgroundMuted
            : BackgroundColor.transparent
        }
        borderRadius={BorderRadius.pill}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        paddingInlineStart={1}
        marginLeft={1}
        gap={1}
        style={{
          cursor: hasMoreThanOneGasFeeTokenToChooseFrom ? 'pointer' : 'default',
          paddingInlineEnd: '6px',
          padding: hasMoreThanOneGasFeeTokenToChooseFrom ? '4px 8px' : '0px',
        }}
      >
        <GasFeeTokenIcon
          tokenAddress={gasTokenAddress}
          size={GasFeeTokenIconSize.Sm}
        />
        <Text>{gasTokenSymbol}</Text>
        {hasMoreThanOneGasFeeTokenToChooseFrom && (
          <Icon
            data-testid="selected-gas-fee-token-arrow"
            name={IconName.ArrowDown}
            size={IconSize.Sm}
          />
        )}
      </Box>
    </>
  );
}
