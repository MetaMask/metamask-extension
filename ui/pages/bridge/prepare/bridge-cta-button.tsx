import React, { useContext, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MetaMetricsHardwareWalletRecoveryLocation } from '../../../../shared/constants/metametrics';
import {
  getFromAmount,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
  getWasTxDeclined,
  BridgeAppState,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import {
  ConnectionStatus,
  useHardwareWalletConfig,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { trackHardwareWalletRecoveryConnectCtaClicked } from '../../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';

export const BridgeCTAButton = ({
  onFetchNewQuotes,
  needsDestinationAddress = false,
  onOpenRecipientModal,
  onOpenAlertModals,
  onOpenMarketClosedModal,
}: {
  onFetchNewQuotes: () => void;
  needsDestinationAddress?: boolean;
  onOpenRecipientModal: () => void;
  onOpenAlertModals?: () => void;
  onOpenMarketClosedModal: () => void;
}) => {
  const t = useI18nContext();

  const toToken = useSelector(getToToken);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const { submitBridgeTransaction, isSubmitting } =
    useSubmitBridgeTransaction();

  const {
    isNoQuotesAvailable,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isStockMarketClosed: isMarketClosed,
    isQuoteExpired,
  } = useSelector(
    (state) => getValidationErrors(state as BridgeAppState, Date.now()),
    shallowEqual,
  );

  const wasTxDeclined = useSelector(getWasTxDeclined);

  const isTxSubmittable = useIsTxSubmittable();

  const { trackEvent } = useContext(MetaMetricsContext);

  const { isHardwareWalletAccount, walletType } = useHardwareWalletConfig();
  const { connectionState } = useHardwareWalletState();

  const hardwareWalletName = useMemo(
    () => (walletType ? t(walletType) : undefined),
    [t, walletType],
  );

  const isHardwareWalletReady = useMemo(() => {
    if (!isHardwareWalletAccount) {
      return true;
    }
    return [ConnectionStatus.Connected, ConnectionStatus.Ready].includes(
      connectionState.status,
    );
  }, [connectionState.status, isHardwareWalletAccount]);

  /**
   * Defines the behavior of the CTA button based on the current state
   */
  const buttonProps = useMemo(() => {
    if (!isLoading && (wasTxDeclined || isQuoteExpired)) {
      return {
        disabled: false,
        onClick: onFetchNewQuotes,
        children: t('bridgeGetNewQuote'),
      };
    }

    if (needsDestinationAddress) {
      return {
        disabled: false,
        onClick: onOpenRecipientModal,
        children: t('bridgeSelectDestinationAccount'),
      };
    }

    if (isMarketClosed) {
      return {
        disabled: false,
        onClick: onOpenMarketClosedModal,
        children: t('bridgeMarketClosedAction'),
      };
    }

    if (!activeQuote) {
      return undefined;
    }

    if (
      isInsufficientBalance ||
      isInsufficientGasForQuote ||
      isInsufficientGasBalance
    ) {
      return {
        disabled: true,
        children: t('alertReasonInsufficientBalance'),
      };
    }

    const submitHandler = async () => {
      if (onOpenAlertModals) {
        onOpenAlertModals?.();
        return;
      }
      await submitBridgeTransaction(activeQuote);
    };

    if (isHardwareWalletAccount && !isHardwareWalletReady) {
      return {
        disabled: false,
        onClick: async () => {
          trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, {
            location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
            walletType,
            connectionState,
          });
          await submitHandler();
        },
        children: hardwareWalletName
          ? t('connectHardwareDevice', [hardwareWalletName])
          : t('connect'),
      };
    }

    return {
      disabled: !isTxSubmittable || isSubmitting,
      onClick: submitHandler,
      children: t('swap'),
    };
  }, [
    activeQuote,
    connectionState,
    isLoading,
    isMarketClosed,
    isQuoteExpired,
    needsDestinationAddress,
    onOpenRecipientModal,
    hardwareWalletName,
    isHardwareWalletAccount,
    isHardwareWalletReady,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isSubmitting,
    isTxSubmittable,
    onFetchNewQuotes,
    onOpenMarketClosedModal,
    onOpenAlertModals,
    submitBridgeTransaction,
    t,
    trackEvent,
    walletType,
    wasTxDeclined,
  ]);

  /**
   * These labels are displayed when there are no quotes available
   */
  const label = useMemo(() => {
    if (!fromAmount) {
      if (!toToken) {
        return needsDestinationAddress
          ? t('bridgeSelectTokenAmountAndAccount')
          : t('bridgeSelectTokenAndAmount');
      }
      return needsDestinationAddress
        ? t('bridgeSelectDestinationAccount')
        : t('bridgeEnterAmount');
    }

    return t('swapSelectToken');
  }, [fromAmount, toToken, needsDestinationAddress, t]);

  // Hide the CTA if the quotes are loading or if there are no quotes available
  if ((isNoQuotesAvailable && !isQuoteExpired) || (isLoading && !activeQuote)) {
    return null;
  }

  return buttonProps ? (
    <Button
      size={ButtonSize.Lg}
      variant={ButtonVariant.Primary}
      data-testid="bridge-cta-button"
      isFullWidth
      style={{ boxShadow: 'none' }}
      isLoading={isSubmitting}
      disabled={buttonProps.disabled}
      onClick={async () => await buttonProps.onClick?.()}
      children={buttonProps.children}
    />
  ) : (
    <Text
      variant={TextVariant.BodyMd}
      textAlign={TextAlign.Center}
      color={TextColor.TextAlternative}
    >
      {label}
    </Text>
  );
};
