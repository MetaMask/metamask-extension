import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { useNavigate } from 'react-router-dom';

import { getSelectedEvmInternalAccount } from '../../../selectors';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../store/actions';
import {
  CONFIRM_TRANSACTION_ROUTE,
  HYPERLIQUID_DEPOSIT_ROUTE,
} from '../../../helpers/constants/routes';
import {
  createHyperliquidDepositTransactionParams,
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
} from '../../../../shared/lib/hyperliquid-deposit-transaction';

export const HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC = '100';
const HYPERLIQUID_DEPOSIT_CONFIRMATION_LOADER = 'customAmount';

export type HyperliquidDepositPromptResult =
  | {
      started: true;
      transactionId: string;
    }
  | {
      started: false;
      suppress?: boolean;
    };

type HyperliquidDepositPromptProps = {
  onActionComplete?: (result: HyperliquidDepositPromptResult) => void;
  selectedAddress?: string;
};

const FlowButton = ({
  children,
  dataTestId,
  disabled = false,
  isLoading = false,
  onClick,
}: {
  children: React.ReactNode;
  dataTestId: string;
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className="hyperliquid-deposit__button"
      data-testid={dataTestId}
      disabled={disabled || isLoading}
      onClick={onClick}
      type="button"
    >
      {isLoading ? 'Preparing...' : children}
    </button>
  );
};

const ManualDepositButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      className="hyperliquid-deposit__manual-link"
      onClick={onClick}
      type="button"
    >
      No thanks, I&apos;ll deposit manually.
    </button>
  );
};

export const HyperliquidLogo = ({ success = false }: { success?: boolean }) => {
  return (
    <div className="hyperliquid-deposit__logo-wrap">
      <div className="hyperliquid-deposit__logo-tile" aria-hidden="true">
        <img
          alt=""
          className="hyperliquid-deposit__logo"
          data-testid="hyperliquid-deposit-logo"
          src="./images/hyperliquid-logo.svg"
        />
      </div>
      {success ? (
        <span
          className="hyperliquid-deposit__success-mark"
          aria-label="Success"
          role="img"
        >
          ✓
        </span>
      ) : null}
    </div>
  );
};

const DepositLogoPair = () => {
  return (
    <div
      aria-label="MetaMask and Hyperliquid"
      className="hyperliquid-deposit__logo-pair"
      role="img"
    >
      <span className="hyperliquid-deposit__logo-pair-tile">
        <img
          alt=""
          className="hyperliquid-deposit__logo-pair-image"
          data-testid="metamask-deposit-logo"
          src="./images/logo/metamask-fox.svg"
        />
      </span>
      <span
        className="hyperliquid-deposit__logo-pair-separator"
        data-testid="hyperliquid-deposit-logo-separator"
      >
        ×
      </span>
      <span className="hyperliquid-deposit__logo-pair-tile hyperliquid-deposit__logo-pair-tile--hyperliquid">
        <img
          alt=""
          className="hyperliquid-deposit__logo-pair-image"
          data-testid="hyperliquid-deposit-logo"
          src="./images/hyperliquid-logo.svg"
        />
      </span>
    </div>
  );
};

const CloseButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      aria-label="Close"
      className="hyperliquid-deposit__close-button"
      onClick={onClick}
      type="button"
    >
      ×
    </button>
  );
};

const InlineError = ({ message }: { message?: string }) => {
  if (!message) {
    return null;
  }

  return <p className="hyperliquid-deposit__error">{message}</p>;
};

export const HyperliquidDepositPrompt = ({
  onActionComplete,
  selectedAddress,
}: HyperliquidDepositPromptProps) => {
  const selectedAccount = useSelector(
    getSelectedEvmInternalAccount,
  ) as InternalAccount | undefined;
  const navigate = useNavigate();

  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    if (onActionComplete) {
      onActionComplete({ started: false });
      return;
    }

    window.close();
  }, [onActionComplete]);

  const handleManualDeposit = useCallback(() => {
    if (onActionComplete) {
      onActionComplete({ started: false, suppress: true });
      return;
    }

    window.close();
  }, [onActionComplete]);

  const handleReviewDeposit = useCallback(async () => {
    const fromAddress = selectedAddress || selectedAccount?.address;

    if (!fromAddress) {
      setError('Select an account before funding Hyperliquid.');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const depositTransactionId = await createDepositConfirmationTransaction({
        from: fromAddress as Hex,
      });

      onActionComplete?.({
        started: true,
        transactionId: depositTransactionId,
      });
      navigate(
        getHyperliquidDepositConfirmationRoute(depositTransactionId),
      );
    } catch (depositError) {
      setError(getErrorMessage(depositError));
      setIsSubmitting(false);
    }
  }, [
    navigate,
    onActionComplete,
    selectedAccount?.address,
    selectedAddress,
  ]);

  return (
    <main className="hyperliquid-deposit">
      <section
        className="hyperliquid-deposit__panel"
        aria-label="Fund Hyperliquid Perps"
      >
        <div className="hyperliquid-deposit__step hyperliquid-deposit__step--intro">
          <CloseButton onClick={handleClose} />
          <DepositLogoPair />
          <div className="hyperliquid-deposit__copy">
            <h1>Deposit to Hyperliquid from any token</h1>
            <p>
              Hyperliquid requires USDC on Arbitrum. With MetaMask, use any
              token to fund your perps wallet with 1 click.
            </p>
          </div>
          <InlineError message={error} />
          <div className="hyperliquid-deposit__actions">
            <FlowButton
              dataTestId="hyperliquid-deposit-intro-button"
              isLoading={isSubmitting}
              onClick={handleReviewDeposit}
            >
              Review deposit
            </FlowButton>
            <ManualDepositButton onClick={handleManualDeposit} />
          </div>
        </div>
      </section>
    </main>
  );
};

export function getHyperliquidDepositStatusRoute(transactionId: string): string {
  const searchParams = new URLSearchParams({
    step: 'status',
    txId: transactionId,
  });

  return `${HYPERLIQUID_DEPOSIT_ROUTE}?${searchParams.toString()}`;
}

export function getHyperliquidDepositConfirmationRoute(transactionId: string) {
  const searchParams = new URLSearchParams({
    loader: HYPERLIQUID_DEPOSIT_CONFIRMATION_LOADER,
    goBackTo: getHyperliquidDepositStatusRoute(transactionId),
  });

  return {
    pathname: `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`,
    search: searchParams.toString(),
  };
}

async function createDepositConfirmationTransaction({
  from,
}: {
  from: Hex;
}): Promise<string> {
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
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to prepare Hyperliquid deposit.';
}
