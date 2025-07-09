import React, { useCallback, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

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
import { getNetworkConfigurationsByChainId } from '../../../../../../../../shared/modules/selectors/networks';
import { GasFeeTokenModal } from '../gas-fee-token-modal';
import { useSelectedGasFeeToken } from '../../hooks/useGasFeeToken';
import { GasFeeTokenIcon, GasFeeTokenIconSize } from '../gas-fee-token-icon';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useInsufficientBalanceAlerts } from '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SelectedGasFeeToken() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, gasFeeTokens } = currentConfirmation;

  const { isSupported: isGaslessSupported, isSmartTransaction } =
    useIsGaslessSupported();

  const hasInsufficientNative = Boolean(
    useInsufficientBalanceAlerts({ ignoreGasFeeToken: true }).length,
  );

  const hasOnlyFutureNativeToken =
    gasFeeTokens?.length === 1 &&
    gasFeeTokens[0].tokenAddress === NATIVE_TOKEN_ADDRESS;

  const supportsFutureNative = hasInsufficientNative && isSmartTransaction;

  const hasGasFeeTokens =
    isGaslessSupported &&
    Boolean(gasFeeTokens?.length) &&
    (!hasOnlyFutureNativeToken || supportsFutureNative);

  const networkConfiguration = useSelector(getNetworkConfigurationsByChainId)?.[
    chainId
  ];

  const handleClick = useCallback(() => {
    if (!hasGasFeeTokens) {
      return;
    }

    setIsModalOpen(true);
  }, [hasGasFeeTokens]);

  const nativeTicker = networkConfiguration?.nativeCurrency;
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
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderRadius={BorderRadius.pill}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        paddingInlineStart={1}
        gap={1}
        style={{
          cursor: hasGasFeeTokens ? 'pointer' : 'default',
          paddingInlineEnd: '6px',
        }}
      >
        <GasFeeTokenIcon
          tokenAddress={gasFeeToken?.tokenAddress ?? NATIVE_TOKEN_ADDRESS}
          size={GasFeeTokenIconSize.Sm}
        />
        <Text>{symbol}</Text>
        {hasGasFeeTokens && (
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
