import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { useNavigate } from 'react-router-dom-v5-compat';
import { getCustomNonceValue } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import {
  getSubscriptions,
  getTransactions,
  startSubscriptionWithCrypto,
  updateAndApproveTx,
} from '../../../../store/actions';
import {
  getIsSmartTransaction,
  type SmartTransactionsState,
} from '../../../../../shared/modules/selectors';
import { useDecodedTransactionData } from '../../components/confirm/info/hooks/useDecodedTransactionData';
import { useShieldSubscriptionPricingFromTokenApproval } from '../../../../hooks/subscription/useSubscriptionPricing';
import { MetaMaskReduxDispatch } from '../../../../store/store';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import { TRANSACTION_SHIELD_ROUTE } from '../../../../helpers/constants/routes';

export function useTransactionConfirm() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const isSmartTransaction = useSelector((state: SmartTransactionsState) =>
    getIsSmartTransaction(state, transactionMeta?.chainId),
  );
  const navigate = useNavigate();

  const evmInternalAccount = useSelector((state) =>
    // Account address will be the same for all EVM accounts
    getInternalAccountBySelectedAccountGroupAndCaip(state, 'eip155:1'),
  );

  const newTransactionMeta = useMemo(
    () => cloneDeep(transactionMeta),
    [transactionMeta],
  );

  const handleSmartTransaction = useCallback(() => {
    if (!selectedGasFeeToken) {
      return;
    }

    newTransactionMeta.batchTransactions = [
      {
        ...selectedGasFeeToken.transferTransaction,
        type: TransactionType.gasPayment,
      },
    ];

    newTransactionMeta.txParams.gas = selectedGasFeeToken.gas;
    newTransactionMeta.txParams.maxFeePerGas = selectedGasFeeToken.maxFeePerGas;

    newTransactionMeta.txParams.maxPriorityFeePerGas =
      selectedGasFeeToken.maxPriorityFeePerGas;
  }, [selectedGasFeeToken, newTransactionMeta]);

  const handleGasless7702 = useCallback(() => {
    newTransactionMeta.isExternalSign = true;
  }, [newTransactionMeta]);

  const decodeResponse = useDecodedTransactionData({
    data: newTransactionMeta.txParams.data as Hex,
    to: newTransactionMeta.txParams.to as Hex,
  });
  const decodedApprovalAmount = decodeResponse?.value?.data[0].params.find(
    (param) => param.name === 'value',
  )?.value;

  const { productPrice, tokenPrice } =
    useShieldSubscriptionPricingFromTokenApproval({
      transactionMeta: newTransactionMeta,
      decodedApprovalAmount,
    });

  const { trialedProducts } = useUserSubscriptions();
  const isTrialed = trialedProducts?.includes(PRODUCT_TYPES.SHIELD);

  const handleSubscriptionApprove = useCallback(
    async (transactionId: string) => {
      const transactions = await getTransactions();
      const confirmedTx = transactions.find((tx) => tx.id === transactionId);
      if (!productPrice) {
        console.error('Product price not found', transactionId);
        return;
      }

      if (confirmedTx) {
        const { rawTx } = confirmedTx;
        if (rawTx) {
          await dispatch(
            startSubscriptionWithCrypto({
              products: [PRODUCT_TYPES.SHIELD],
              isTrialRequested: !isTrialed,
              recurringInterval: productPrice.interval,
              billingCycles: productPrice.minBillingCycles,
              chainId: confirmedTx.chainId,
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
          console.error(
            'Subscription approve transaction rawTx not found',
            transactionId,
          );
        }
      } else {
        console.error(
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

  const onTransactionConfirm = useCallback(async () => {
    newTransactionMeta.customNonceValue = customNonceValue;

    if (isSmartTransaction) {
      handleSmartTransaction();
    } else if (selectedGasFeeToken) {
      handleGasless7702();
    }

    await dispatch(updateAndApproveTx(newTransactionMeta, true, ''));

    if (newTransactionMeta.type === TransactionType.shieldSubscriptionApprove) {
      await handleSubscriptionApprove(newTransactionMeta.id);
    }
  }, [
    customNonceValue,
    dispatch,
    handleGasless7702,
    handleSmartTransaction,
    handleSubscriptionApprove,
    isSmartTransaction,
    newTransactionMeta,
    selectedGasFeeToken,
  ]);

  return {
    onTransactionConfirm,
  };
}
