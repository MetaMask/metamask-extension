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
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
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
import { shortenAddress } from '../../../helpers/utils/util';
import { getAccountName, getInternalAccounts } from '../../../selectors';
import { isCryptoPaymentMethod } from './types';
import { ButtonRow } from './components';

type PaymentMethodRowProps = {
  displayedShieldSubscription?: Subscription;
  subscriptionPricing?: PricingResponse;
  onPaymentMethodChange: (
    paymentType: PaymentType,
    token?: TokenWithApprovalAmount,
  ) => void;
  showSkeletonLoader?: boolean;
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
  showSkeletonLoader = false,
  isCheckSubscriptionInsufficientFundsDisabled,
  isPaused,
  isUnexpectedErrorCryptoPayment,
  handlePaymentError,
  handlePaymentErrorInsufficientFunds,
}: PaymentMethodRowProps) => {
  const t = useI18nContext();
  const internalAccounts = useSelector(getInternalAccounts);
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
      displayedShieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod;

    return availableTokenBalances.filter(
      (token) =>
        token.symbol !== cryptoPayment.crypto.tokenSymbol ||
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

  const payerAccountName = useMemo(() => {
    if (
      !displayedShieldSubscription ||
      !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
    ) {
      return '';
    }
    return (
      getAccountName(
        internalAccounts,
        displayedShieldSubscription.paymentMethod.crypto.payerAddress,
      ) || ''
    );
  }, [displayedShieldSubscription, internalAccounts]);

  const paymentMethodDisplay = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }
    if (isPaused && !isUnexpectedErrorCryptoPayment) {
      let tooltipText = '';
      let buttonText: string | React.ReactNode = '';
      let buttonDisabled = false;
      let buttonOnClick = handlePaymentError;
      if (isCryptoPaymentMethod(displayedShieldSubscription?.paymentMethod)) {
        tooltipText = 'shieldTxMembershipErrorPausedCryptoTooltip';
        buttonText = t('shieldTxMembershipErrorInsufficientToken', [
          displayedShieldSubscription.paymentMethod.crypto.tokenSymbol,
        ]);
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
        buttonText = t('shieldPlanCard');
      }

      return (
        <Tooltip position="top" title={t(tooltipText)}>
          <ButtonRow
            title={t('shieldTxDetails3Title')}
            description={
              <Box className="flex items-center gap-1">
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {buttonText}
                </Text>
                <Icon
                  name={IconName.Warning}
                  size={IconSize.Md}
                  color={IconColor.ErrorDefault}
                />
              </Box>
            }
            descriptionClassName="text-error-default"
            onClick={buttonOnClick}
            disabled={buttonDisabled}
          />
        </Tooltip>
      );
    }
    if (isSubscriptionEndingSoon && displayedShieldSubscription) {
      return (
        <>
          <ButtonRow
            title={t('shieldTxDetails3Title')}
            description={
              isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
                ? displayedShieldSubscription.paymentMethod.crypto.tokenSymbol
                : ''
            }
            descriptionClassName="text-warning-default"
            onClick={handlePaymentError}
          />
        </>
      );
    }

    if (isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)) {
      const { payerAddress } = displayedShieldSubscription.paymentMethod.crypto;
      const displayName = payerAccountName || shortenAddress(payerAddress);
      const cryptoDetails = t('shieldTxDetails3DescriptionCrypto', [
        displayedShieldSubscription.paymentMethod.crypto.tokenSymbol.toUpperCase(),
        displayName,
      ]);
      return (
        <ButtonRow
          title={t('shieldTxDetails3Title')}
          description={cryptoDetails}
          disabled={
            displayedShieldSubscription.status ===
              SUBSCRIPTION_STATUSES.canceled || // can't change payment method if subscription is canceled
            displayedShieldSubscription.status ===
              SUBSCRIPTION_STATUSES.provisional // payment method crypto verifying, can't change yet
          }
          onClick={() => setShowPaymentModal(true)}
        />
      );
    }

    return (
      <ButtonRow
        title={t('shieldTxDetails3Title')}
        description={t('shieldPlanCard')}
        onClick={() => setShowPaymentModal(true)}
      />
    );
  }, [
    displayedShieldSubscription,
    isPaused,
    isUnexpectedErrorCryptoPayment,
    isSubscriptionEndingSoon,
    t,
    handlePaymentError,
    isCryptoPayment,
    isInsufficientFundsCrypto,
    handlePaymentErrorInsufficientFunds,
    isCheckSubscriptionInsufficientFundsDisabled,
    payerAccountName,
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
