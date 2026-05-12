import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';

import { getSelectedInternalAccount } from '../../selectors';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../confirmations/hooks/useConfirmationNavigation';
import {
  createHyperliquidDepositTransactionParams,
  HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
} from '../../../shared/lib/hyperliquid-deposit-transaction';

export const HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC = '100';

let inFlightDepositConfirmation: Promise<string> | undefined;

const HyperliquidDepositPage = () => {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { navigateToTransaction } = useConfirmationNavigation();
  const { search } = useLocation();
  const triggerId = new URLSearchParams(search).get('trigger') ?? 'initial';
  const startedTriggerIdRef = useRef<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (startedTriggerIdRef.current === triggerId) {
      return;
    }

    startedTriggerIdRef.current = triggerId;

    async function createDepositConfirmation() {
      if (!selectedAccount?.address) {
        setError('Select an account before funding Hyperliquid.');
        return;
      }

      try {
        const transactionId = await getDepositConfirmationTransactionId(
          selectedAccount.address as Hex,
        );

        navigateToTransaction(transactionId, {
          loader: ConfirmationLoader.CustomAmount,
        });
      } catch (depositError) {
        setError(getErrorMessage(depositError));
      }
    }

    createDepositConfirmation();
  }, [navigateToTransaction, selectedAccount?.address, triggerId]);

  return (
    <main className="hyperliquid-deposit">
      <section className="hyperliquid-deposit__launcher">
        <h1>Preparing Hyperliquid deposit confirmation</h1>
        {error ? (
          <p className="hyperliquid-deposit__error">{error}</p>
        ) : (
          <p>Opening confirmation...</p>
        )}
      </section>
    </main>
  );
};

async function getDepositConfirmationTransactionId(from: Hex): Promise<string> {
  if (!inFlightDepositConfirmation) {
    inFlightDepositConfirmation = createDepositConfirmationTransaction(from);
  }

  return await inFlightDepositConfirmation;
}

async function createDepositConfirmationTransaction(from: Hex): Promise<string> {
  try {
    const networkClientId = await findNetworkClientIdByChainId(
      HYPERLIQUID_DEPOSIT_CHAIN_ID,
    );
    const txMeta = await addTransaction(
      createHyperliquidDepositTransactionParams({
        amount: HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC,
        from,
      }),
      {
        networkClientId,
        requestId: HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
        requireApproval: true,
        type: TransactionType.perpsDeposit,
      },
    );

    return txMeta.id;
  } finally {
    inFlightDepositConfirmation = undefined;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to prepare Hyperliquid deposit.';
}

export default HyperliquidDepositPage;
