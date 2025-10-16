import { useDispatch, useSelector } from "react-redux";
import { getSignedTransactions } from "../../selectors";
import { TransactionMeta, TransactionType } from "@metamask/transaction-controller";
import { useCallback, useEffect, useMemo } from "react";
import { RootState } from "../../pages/confirmations/selectors/preferences";
import { getInternalAccountBySelectedAccountGroupAndCaip } from "../../selectors/multichain-accounts/account-tree";
import { useNavigate } from "react-router-dom-v5-compat";
import { useShieldSubscriptionPricingFromTokenApproval } from "../../hooks/subscription/useSubscriptionPricing";
import { useUserSubscriptions } from "../../hooks/subscription/useSubscription";
import { PRODUCT_TYPES } from "@metamask/subscription-controller";
import { MetaMaskReduxDispatch } from "../../store/store";
import { getSubscriptions, startSubscriptionWithCrypto } from "../../store/actions";
import { TRANSACTION_SHIELD_ROUTE } from "../../helpers/constants/routes";
import { Hex } from "viem";
import log from "loglevel";
import { selectIsSignedIn } from "../../selectors/identity/authentication";
import { getIsUnlocked } from "../../ducks/metamask/metamask";
import { useDecodedTransactionDataValue } from "../../hooks/useDecodedTransactionData";
import { getIsShieldSubscriptionActive } from "../../../shared/lib/shield";

/**
 * Hook to handle shield subscription after subscription crypto approval transaction is signed
 */
export const useShieldApproveTransaction = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const evmInternalAccount = useSelector((state) =>
    // Account address will be the same for all EVM accounts
    getInternalAccountBySelectedAccountGroupAndCaip(state, 'eip155:1'),
  );
  const isSignedIn = useSelector(selectIsSignedIn);
  const isUnlocked = useSelector(getIsUnlocked);

  const signedTransactions = useSelector<RootState, TransactionMeta[]>(
    getSignedTransactions,
  );
  // check if there is a shield approve transaction signed
  const shieldApproveTransaction = useMemo(() => {
    return signedTransactions.find((transaction) => transaction.type === TransactionType.shieldSubscriptionApprove);
  }, [signedTransactions]);

  const { decodeResponse: { pending: decodedApprovalAmountPending }, value: decodedApprovalAmount } =
    useDecodedTransactionDataValue(shieldApproveTransaction);

  const { productPrice, tokenPrice } =
    useShieldSubscriptionPricingFromTokenApproval({
      transactionMeta: shieldApproveTransaction,
      decodedApprovalAmount,
    });

  const { trialedProducts, subscriptions } = useUserSubscriptions();
  const isTrialed = trialedProducts?.includes(PRODUCT_TYPES.SHIELD);
  const isActiveShieldSubscription = useMemo(() => getIsShieldSubscriptionActive(subscriptions), [subscriptions]);

  /**
   * Handle shield subscription start after transaction is submitted
   */
  const handleShieldSubscriptionStart = useCallback(
    async (signedTxMeta: TransactionMeta) => {
      if (signedTxMeta.type !== TransactionType.shieldSubscriptionApprove) {
        return;
      }

      // refetch the latest transaction meta to have rawTx available
      const { id: transactionId } = signedTxMeta;
      if (!productPrice) {
        log.error('Product price not found', transactionId);
        return;
      }

      if (!evmInternalAccount?.address) {
        log.error('EVM internal account not found', evmInternalAccount);
        return;
      }

      if (signedTxMeta) {
        const { rawTx } = signedTxMeta;
        if (rawTx) {
          // submit new subscription approval transaction to server
          // could be start new subscription or update insufficient approval for paused subscription
          await dispatch(
            startSubscriptionWithCrypto({
              products: [PRODUCT_TYPES.SHIELD],
              isTrialRequested: !isTrialed,
              recurringInterval: productPrice.interval,
              billingCycles: productPrice.minBillingCycles,
              chainId: signedTxMeta.chainId,
              payerAddress: evmInternalAccount?.address as Hex,
              tokenSymbol: tokenPrice?.symbol as string,
              rawTransaction: rawTx as Hex,
            }),
          );
          // refetch subscriptions with the newly created one
          await dispatch(getSubscriptions());
          // navigate to shield settings page after successful subscription approval
          navigate(TRANSACTION_SHIELD_ROUTE);
        } else {
          log.error(
            'Subscription approve transaction rawTx not found',
            transactionId,
          );
        }
      } else {
        log.error(
          'Subscription approve transaction not found',
          transactionId,
        );
      }
    },
    [
      productPrice,
      isTrialed,
      navigate,
      dispatch,
      evmInternalAccount,
      tokenPrice,
    ],
  );

  useEffect(() => {
    if (!isSignedIn || !isUnlocked || !shieldApproveTransaction || isActiveShieldSubscription || decodedApprovalAmountPending) {
      return;
    }

    handleShieldSubscriptionStart(shieldApproveTransaction).catch((error) => {
      log.error('Error handling shield subscription start', error);
    });
  }, [isSignedIn, isUnlocked, isActiveShieldSubscription, shieldApproveTransaction, handleShieldSubscriptionStart, decodedApprovalAmountPending]);
};
