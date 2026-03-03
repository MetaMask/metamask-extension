import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonLink,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import {
  getFromAmount,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
  getWasTxDeclined,
  getIsQuoteExpired,
  BridgeAppState,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import {
  AlignItems,
  BlockSize,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import { Row } from '../layout';
import {
  ConnectionStatus,
  useHardwareWalletActions,
  useHardwareWalletConfig,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';

export const BridgeCTAButton = ({
  onFetchNewQuotes,
  needsDestinationAddress = false,
  onOpenRecipientModal,
}: {
  onFetchNewQuotes: () => void;
  needsDestinationAddress?: boolean;
  onOpenRecipientModal?: () => void;
}) => {
  const t = useI18nContext();

  const toToken = useSelector(getToToken);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const isQuoteExpired = useSelector((state) =>
    getIsQuoteExpired(state as BridgeAppState, Date.now()),
  );
  const { submitBridgeTransaction } = useSubmitBridgeTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const {
    isNoQuotesAvailable,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isTxAlertPresent,
    isTxAlertLoading,
  } = useSelector(getValidationErrors);

  const wasTxDeclined = useSelector(getWasTxDeclined);

  const isTxSubmittable = useIsTxSubmittable();

  const { isHardwareWalletAccount, walletType } = useHardwareWalletConfig();
  const { ensureDeviceReady } = useHardwareWalletActions();
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

  const label = useMemo(() => {
    if (wasTxDeclined) {
      return { key: 'youDeclinedTheTransaction' };
    }

    if (!fromAmount) {
      if (!toToken) {
        return {
          key: needsDestinationAddress
            ? 'bridgeSelectTokenAmountAndAccount'
            : 'bridgeSelectTokenAndAmount',
        };
      }
      return {
        key: needsDestinationAddress
          ? 'bridgeSelectDestinationAccount'
          : 'bridgeEnterAmount',
      };
    }

    if (needsDestinationAddress) {
      return { key: 'bridgeSelectDestinationAccount' };
    }

    if (isQuoteExpired && !isLoading) {
      return { key: 'bridgeQuoteExpired' };
    }

    if (isLoading && !isTxSubmittable && !activeQuote) {
      return undefined;
    }

    if (isInsufficientGasBalance || isNoQuotesAvailable) {
      return undefined;
    }

    if (isInsufficientBalance || isInsufficientGasForQuote) {
      return { key: 'alertReasonInsufficientBalance' };
    }

    if (isTxSubmittable || isTxAlertPresent || isTxAlertLoading) {
      if (isHardwareWalletAccount && !isHardwareWalletReady) {
        return hardwareWalletName
          ? { key: 'connectHardwareDevice', args: [hardwareWalletName] }
          : { key: 'connect' };
      }
      return { key: 'swap' };
    }

    return { key: 'swapSelectToken' };
  }, [
    isLoading,
    isTxAlertPresent,
    isTxAlertLoading,
    fromAmount,
    toToken,
    isTxSubmittable,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    wasTxDeclined,
    isQuoteExpired,
    needsDestinationAddress,
    activeQuote,
    isNoQuotesAvailable,
    isHardwareWalletAccount,
    isHardwareWalletReady,
    hardwareWalletName,
  ]);

  // Label for the secondary button that re-starts quote fetching
  const secondaryButtonLabel = useMemo(() => {
    if (wasTxDeclined || isQuoteExpired) {
      return 'bridgeFetchNewQuotes';
    }
    return undefined;
  }, [wasTxDeclined, isQuoteExpired]);

  return (activeQuote || needsDestinationAddress) && !secondaryButtonLabel ? (
    <Button
      width={BlockSize.Full}
      size={ButtonSize.Lg}
      variant={ButtonVariant.Primary}
      data-testid="bridge-cta-button"
      style={{ boxShadow: 'none' }}
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={async () => {
        if (needsDestinationAddress && onOpenRecipientModal) {
          onOpenRecipientModal();
          return;
        }

        if (activeQuote && isTxSubmittable && !isSubmitting) {
          // Set submitting state before async checks to prevent duplicate clicks.
          setIsSubmitting(true);

          try {
            // Verify hardware wallet device is ready before submitting.
            if (isHardwareWalletAccount) {
              const isDeviceReady = await ensureDeviceReady();
              if (!isDeviceReady) {
                return;
              }
            }

            // We don't need to worry about setting to false if the tx submission succeeds
            // because we route immediately to Activity list page
            await submitBridgeTransaction(activeQuote);
          } finally {
            if (mountedRef.current) {
              setIsSubmitting(false);
            }
          }
        }
      }}
      loading={isSubmitting}
      disabled={
        (!needsDestinationAddress && (!isTxSubmittable || isQuoteExpired)) ||
        isSubmitting
      }
    >
      {label?.key ? t(label.key, label.args) : ''}
    </Button>
  ) : (
    <Row
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={1}
    >
      <Text
        variant={TextVariant.bodyMd}
        textAlign={TextAlign.Center}
        color={TextColor.textAlternative}
      >
        {label?.key ? t(label.key, label.args) : ''}
      </Text>
      {secondaryButtonLabel && (
        <ButtonLink
          as="a"
          variant={TextVariant.bodyMd}
          style={{ whiteSpace: 'nowrap' }}
          onClick={onFetchNewQuotes}
        >
          {t(secondaryButtonLabel)}
        </ButtonLink>
      )}
    </Row>
  );
};
