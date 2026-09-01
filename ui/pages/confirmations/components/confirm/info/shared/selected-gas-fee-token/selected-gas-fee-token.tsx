import React, { useCallback, useMemo, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Box,
  BoxAlignItems,
  Icon,
  IconName,
  IconSize,
  Text,
} from '@metamask/design-system-react';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { useConfirmContext } from '../../../../../context/confirm';
import { useDappSwapContext } from '../../../../../context/dapp-swap';
import { GasFeeTokenModal } from '../gas-fee-token-modal';
import { useSelectedGasFeeToken } from '../../hooks/useGasFeeToken';
import { GasFeeTokenIcon, GasFeeTokenIconSize } from '../gas-fee-token-icon';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useIsInsufficientBalance } from '../../../../../hooks/useIsInsufficientBalance';
import { useNativeCurrencySymbol } from '../../hooks/useNativeCurrencySymbol';

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

  const handleClick = useCallback(() => {
    if (!hasMoreThanOneGasFeeTokenToChooseFrom) {
      return;
    }

    setIsModalOpen(true);
  }, [hasMoreThanOneGasFeeTokenToChooseFrom]);

  const { nativeCurrencySymbol: nativeTicker } =
    useNativeCurrencySymbol(chainId);
  const gasFeeToken = useSelectedGasFeeToken();
  const symbol = gasFeeToken?.symbol ?? nativeTicker;

  return (
    <>
      {isModalOpen && (
        <GasFeeTokenModal onClose={() => setIsModalOpen(false)} />
      )}
      <Box
        data-testid="selected-gas-fee-token"
        onClick={handleClick}
        className="inline-flex"
        alignItems={BoxAlignItems.Center}
        gap={1}
        style={{
          cursor: hasMoreThanOneGasFeeTokenToChooseFrom ? 'pointer' : 'default',
        }}
      >
        <GasFeeTokenIcon
          tokenAddress={gasFeeToken?.tokenAddress ?? NATIVE_TOKEN_ADDRESS}
          size={GasFeeTokenIconSize.Sm}
        />
        <Text>{symbol}</Text>
        {hasMoreThanOneGasFeeTokenToChooseFrom && (
          <Icon
            data-testid="selected-gas-fee-token-arrow"
            name={IconName.ArrowRight}
            size={IconSize.Sm}
          />
        )}
      </Box>
    </>
  );
}
