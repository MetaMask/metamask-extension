import React, { useMemo, useState } from 'react';
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
  HardwareWalletError,
  useHardwareWallet,
  useHardwareWalletError,
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

  const {
    isNoQuotesAvailable,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isTxAlertPresent,
  } = useSelector(getValidationErrors);

  const wasTxDeclined = useSelector(getWasTxDeclined);

  const isTxSubmittable = useIsTxSubmittable();

  const { isHardwareWalletAccount, ensureDeviceReady } = useHardwareWallet();

  const { showErrorModal } = useHardwareWalletError();

  const label = useMemo(() => {
    if (wasTxDeclined) {
      return 'youDeclinedTheTransaction';
    }

    if (!fromAmount) {
      if (!toToken) {
        return needsDestinationAddress
          ? 'bridgeSelectTokenAmountAndAccount'
          : 'bridgeSelectTokenAndAmount';
      }
      return needsDestinationAddress
        ? 'bridgeSelectDestinationAccount'
        : 'bridgeEnterAmount';
    }

    if (needsDestinationAddress) {
      return 'bridgeSelectDestinationAccount';
    }

    if (isQuoteExpired && !isLoading) {
      return 'bridgeQuoteExpired';
    }

    if (isLoading && !isTxSubmittable && !activeQuote) {
      return undefined;
    }

    if (isInsufficientGasBalance || isNoQuotesAvailable) {
      return undefined;
    }

    if (isInsufficientBalance || isInsufficientGasForQuote) {
      return 'alertReasonInsufficientBalance';
    }

    if (isTxSubmittable || isTxAlertPresent) {
      if (isHardwareWalletAccount) {
        return 'hardwareWalletStartTransactionFlow';
      }
      return 'swap';
    }

    return 'swapSelectToken';
  }, [
    isLoading,
    isTxAlertPresent,
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
  ]);

  // Label for the secondary button that re-starts quote fetching
  const secondaryButtonLabel = useMemo(() => {
    if (wasTxDeclined || isQuoteExpired) {
      return 'bridgeFetchNewQuotes';
    }
    return undefined;
  }, [wasTxDeclined, isQuoteExpired]);

  // useEffect(() => {
  //   showErrorModal(
  //     new HardwareWalletError('test', {
  //       code: ErrorCode.AUTH_LOCK_001,
  //       severity: Severity.ERROR,
  //       category: Category.AUTHENTICATION,
  //       retryStrategy: RetryStrategy.RETRY,
  //       userActionable: true,
  //       userMessage: 'test',
  //     }),
  //   );
  // }, []);

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
          try {
            if (isHardwareWalletAccount) {
              console.log('[BridgeCTAButton] Calling ensureDeviceReady');
              await ensureDeviceReady();
              console.log('[BridgeCTAButton] ensureDeviceReady succeeded');
            }
          } catch (error) {
            console.log('[BridgeCTAButton] Error caught:', error);
            console.log('[BridgeCTAButton] Error type:', typeof error);
            console.log(
              '[BridgeCTAButton] Error instanceof HardwareWalletError:',
              error instanceof HardwareWalletError,
            );
            console.log(
              '[BridgeCTAButton] Error code:',
              (error as HardwareWalletError)?.code,
            );
            console.log(
              '[BridgeCTAButton] Error userActionable:',
              (error as HardwareWalletError)?.userActionable,
            );
            showErrorModal(error as HardwareWalletError);
            return;
          }
          try {
            // We don't need to worry about setting to false if the tx submission succeeds
            // because we route immediately to Activity list page
            setIsSubmitting(true);
            await submitBridgeTransaction(activeQuote);
          } finally {
            setIsSubmitting(false);
          }
        }
      }}
      loading={isSubmitting}
      disabled={
        (!needsDestinationAddress &&
          (!isTxSubmittable || isTxAlertPresent || isQuoteExpired)) ||
        isSubmitting
      }
    >
      {label ? t(label) : ''}
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
        {label ? t(label) : ''}
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
