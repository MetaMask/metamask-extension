import React, { useCallback, useMemo, useState } from 'react';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  PaymentType,
  PricingResponse,
  PRODUCT_TYPES,
  Subscription,
  SUBSCRIPTION_STATUSES,
  SubscriptionCryptoPaymentMethod,
} from '@metamask/subscription-controller';
import {
  Box,
  FontWeight,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useAvailableTokenBalances,
  useSubscriptionProductPlans,
  useSubscriptionPaymentMethods,
  TokenWithApprovalAmount,
} from '../../../hooks/subscription/useSubscriptionPricing';
import Tooltip from '../../../components/ui/tooltip';
import { ShieldPaymentModal } from '../../shield-plan/shield-payment-modal';
import {
  getIsShieldSubscriptionCanChangePaymentMethodToCard,
  getIsShieldSubscriptionEndingSoon,
} from '../../../../shared/lib/shield';
import { isCryptoPaymentMethod } from './types';

type PaymentMethodRowProps = {
  displayedShieldSubscription?: Subscription;
  subscriptionPricing?: PricingResponse;
  onPaymentMethodChange: (
    paymentType: PaymentType,
    token?: TokenWithApprovalAmount,
  ) => void;
  showSkeletonLoader: boolean;
  isCheckSubscriptionInsufficientFundsDisabled?: boolean;
  isPaused?: boolean;
  isUnexpectedErrorCryptoPayment?: boolean;
  handlePaymentError: () => void;
  handlePaymentErrorInsufficientFunds: () => void;
};

export const PaymentMethodRow = ({
  displayedShieldSubscription,
  subscriptionPricing,
  onPaymentMethodChange,
  showSkeletonLoader,
  isCheckSubscriptionInsufficientFundsDisabled,
  isPaused,
  isUnexpectedErrorCryptoPayment,
  handlePaymentError,
  handlePaymentErrorInsufficientFunds,
}: PaymentMethodRowProps) => {
  const t = useI18nContext();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const canChangePaymentMethodToCard = useMemo(() => {
    if (!displayedShieldSubscription) {
      return false;
    }
    return getIsShieldSubscriptionCanChangePaymentMethodToCard(
      displayedShieldSubscription,
    );
  }, [displayedShieldSubscription]);

  // Derive isCryptoPayment from subscription
  const isCryptoPayment = useMemo(() => {
    return (
      displayedShieldSubscription?.paymentMethod &&
      isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
    );
  }, [displayedShieldSubscription]);

  // Derive isSubscriptionEndingSoon from subscription
  const isSubscriptionEndingSoon = useMemo(() => {
    if (!displayedShieldSubscription) {
      return false;
    }
    return getIsShieldSubscriptionEndingSoon(displayedShieldSubscription);
  }, [displayedShieldSubscription]);

  // Derive cryptoPaymentMethod from subscriptionPricing
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );

  // Get product price for current subscription interval
  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );

  const selectedProductPrice = useMemo(() => {
    if (!displayedShieldSubscription || !pricingPlans) {
      return undefined;
    }
    return pricingPlans.find(
      (plan) => plan.interval === displayedShieldSubscription.interval,
    );
  }, [pricingPlans, displayedShieldSubscription]);

  // Get available token balances
  const { availableTokenBalances } = useAvailableTokenBalances({
    paymentChains: cryptoPaymentMethod?.chains,
    price: selectedProductPrice,
    productType: PRODUCT_TYPES.SHIELD,
  });
  // change crypto payment method shouldn't change to current token
  const availableTokenBalancesWithoutCurrentToken = useMemo(() => {
    if (
      !displayedShieldSubscription ||
      !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
    ) {
      return availableTokenBalances;
    }

    const cryptoPayment =
      displayedShieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod & {
        crypto: { tokenAddress: string }; // TODO: token Address is returned from backend, but controller type is not updated yet, should remove this after upgrading subscription controller
      };

    return availableTokenBalances.filter(
      (token) =>
        token.address?.toLocaleLowerCase() !==
          cryptoPayment.crypto.tokenAddress?.toLocaleLowerCase() ||
        token.chainId.toLowerCase() !==
          cryptoPayment.crypto.chainId.toLowerCase(),
    );
  }, [availableTokenBalances, displayedShieldSubscription]);

  const hasAvailableToken =
    availableTokenBalancesWithoutCurrentToken.length > 0;

  const isInsufficientFundsCrypto =
    displayedShieldSubscription &&
    isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod) &&
    displayedShieldSubscription.paymentMethod.crypto.error ===
      CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE;

  // Compute tokensSupported
  const tokensSupported = useMemo(() => {
    const chainsAndTokensSupported = cryptoPaymentMethod?.chains ?? [];
    return [
      ...new Set(
        chainsAndTokensSupported.flatMap((chain) =>
          chain.tokens.map((token) => token.symbol),
        ),
      ),
    ] as string[];
  }, [cryptoPaymentMethod?.chains]);

  // Derive selectedPaymentMethod from subscription
  const selectedPaymentMethod = useMemo<PaymentType>(() => {
    if (!displayedShieldSubscription) {
      return PAYMENT_TYPES.byCard;
    }
    return displayedShieldSubscription.paymentMethod.type;
  }, [displayedShieldSubscription]);

  // Derive selectedToken from subscription or first available
  const selectedToken = useMemo<TokenWithApprovalAmount | undefined>(() => {
    if (!displayedShieldSubscription) {
      return availableTokenBalancesWithoutCurrentToken[0];
    }

    if (isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)) {
      const tokenInfo = (
        displayedShieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod
      ).crypto;
      const token = availableTokenBalancesWithoutCurrentToken.find(
        (at) =>
          at.symbol === tokenInfo.tokenSymbol &&
          at.chainId === tokenInfo.chainId,
      );
      return token || availableTokenBalancesWithoutCurrentToken[0];
    }

    return availableTokenBalancesWithoutCurrentToken[0];
  }, [displayedShieldSubscription, availableTokenBalancesWithoutCurrentToken]);

  const handleClose = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  const handlePaymentMethodChangeInternal = useCallback(
    (newPaymentMethod: PaymentType) => {
      // only trigger payment method change if it's card payment
      // crypto payment method change will be triggered by handleTokenChange
      if (newPaymentMethod === PAYMENT_TYPES.byCard) {
        onPaymentMethodChange(newPaymentMethod);
      }
    },
    [onPaymentMethodChange],
  );

  const handleTokenChange = useCallback(
    (token: TokenWithApprovalAmount) => {
      onPaymentMethodChange(PAYMENT_TYPES.byCrypto, token);
      setShowPaymentModal(false);
    },
    [onPaymentMethodChange],
  );

  const paymentMethodDisplay = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }
    if (isPaused && !isUnexpectedErrorCryptoPayment) {
      let tooltipText = '';
      let buttonText = '';
      let buttonDisabled = false;
      let buttonOnClick = handlePaymentError;
      if (isCryptoPayment) {
        tooltipText = 'shieldTxMembershipErrorPausedCryptoTooltip';
        buttonText = 'shieldTxMembershipErrorInsufficientToken';
        if (isInsufficientFundsCrypto) {
          buttonOnClick = handlePaymentErrorInsufficientFunds;
          // disable button if insufficient funds and not enough token balance to trigger subscription check
          if (isCheckSubscriptionInsufficientFundsDisabled) {
            buttonDisabled = true;
          }
        }
      } else {
        // card payment error case
        tooltipText = 'shieldTxMembershipErrorPausedCardTooltip';
        buttonText = 'shieldTxMembershipErrorUpdateCard';
      }

      return (
        <Tooltip position="top" title={t(tooltipText)}>
          <TextButton
            className="text-error-default decoration-error-default hover:decoration-error-default hover:text-error-default"
            startIconName={IconName.Danger}
            startIconProps={{ size: IconSize.Md }}
            onClick={buttonOnClick}
            disabled={buttonDisabled}
          >
            {t(buttonText, [
              isCryptoPaymentMethod(displayedShieldSubscription?.paymentMethod)
                ? displayedShieldSubscription.paymentMethod.crypto.tokenSymbol
                : '',
            ])}
          </TextButton>
        </Tooltip>
      );
    }
    if (isSubscriptionEndingSoon && displayedShieldSubscription) {
      return (
        <TextButton
          className="text-warning-default decoration-warning-default hover:decoration-warning-default hover:text-warning-default"
          startIconName={IconName.Danger}
          startIconProps={{
            size: IconSize.Md,
          }}
          onClick={handlePaymentError}
        >
          {isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
            ? displayedShieldSubscription.paymentMethod.crypto.tokenSymbol
            : ''}
        </TextButton>
      );
    }

    if (isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)) {
      return (
        <TextButton
          className="text-default decoration-text-default hover:decoration-text-default hover:text-default"
          onClick={() => setShowPaymentModal(true)}
          endIconName={IconName.ArrowRight}
          disabled={
            displayedShieldSubscription.status ===
              SUBSCRIPTION_STATUSES.canceled || // can't change payment method if subscription is canceled
            displayedShieldSubscription.status ===
              SUBSCRIPTION_STATUSES.provisional // payment method crypto verifying, can't change yet
          }
        >
          {displayedShieldSubscription.paymentMethod.crypto.tokenSymbol}
        </TextButton>
      );
    }

    return `${displayedShieldSubscription.paymentMethod.card.brand.charAt(0).toUpperCase() + displayedShieldSubscription.paymentMethod.card.brand.slice(1)} - ${displayedShieldSubscription.paymentMethod.card.last4}`;
  }, [
    displayedShieldSubscription,
    isPaused,
    isUnexpectedErrorCryptoPayment,
    isCryptoPayment,
    isSubscriptionEndingSoon,
    t,
    handlePaymentError,
    isCheckSubscriptionInsufficientFundsDisabled,
    handlePaymentErrorInsufficientFunds,
    isInsufficientFundsCrypto,
  ]);

  if (showSkeletonLoader) {
    return (
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        -
      </Text>
    );
  }

  // For error states, return the error button (not clickable for modal)
  if (
    (isPaused && !isUnexpectedErrorCryptoPayment) ||
    isSubscriptionEndingSoon
  ) {
    return <>{paymentMethodDisplay}</>;
  }

  // For normal states, make it clickable
  return (
    <>
      <Box>{paymentMethodDisplay}</Box>
      <ShieldPaymentModal
        disableCardOption={!canChangePaymentMethodToCard}
        isOpen={showPaymentModal}
        onClose={handleClose}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={handlePaymentMethodChangeInternal}
        availableTokenBalances={availableTokenBalancesWithoutCurrentToken}
        selectedToken={selectedToken}
        onAssetChange={handleTokenChange}
        hasStableTokenWithBalance={hasAvailableToken}
        tokensSupported={tokensSupported}
      />
    </>
  );
};
