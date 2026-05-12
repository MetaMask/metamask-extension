import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { getSelectedInternalAccount } from '../../selectors';
import { selectTransactionById } from '../../selectors/transactionController';
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
import {
  HYPERLIQUID_DEPOSIT_ROUTE,
  PERPS_ACTIVITY_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../helpers/constants/routes';

export const HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC = '100';

type HyperliquidDepositStep = 'intro' | 'status';
type HyperliquidDepositStatus = 'pending' | 'confirmed' | 'failed';

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

const PerpsGlyph = ({ success = false }: { success?: boolean }) => {
  return (
    <div className="hyperliquid-deposit__glyph-wrap">
      <div className="hyperliquid-deposit__glyph" aria-hidden="true">
        <span className="hyperliquid-deposit__glyph-node hyperliquid-deposit__glyph-node--left" />
        <span className="hyperliquid-deposit__glyph-link" />
        <span className="hyperliquid-deposit__glyph-node hyperliquid-deposit__glyph-node--right" />
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

const CloseButton = () => {
  return (
    <button
      aria-label="Close"
      className="hyperliquid-deposit__close-button"
      onClick={() => window.close()}
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

const IntroStep = ({
  error,
  isSubmitting,
  onContinue,
}: {
  error?: string;
  isSubmitting: boolean;
  onContinue: () => void;
}) => {
  return (
    <div className="hyperliquid-deposit__step hyperliquid-deposit__step--intro">
      <PerpsGlyph />
      <div className="hyperliquid-deposit__copy">
        <h1>Deposit to Hyperliquid</h1>
        <p>Fund your Hyperliquid perps wallet from MetaMask.</p>
      </div>
      <InlineError message={error} />
      <FlowButton
        dataTestId="hyperliquid-deposit-intro-button"
        isLoading={isSubmitting}
        onClick={onContinue}
      >
        Review deposit
      </FlowButton>
    </div>
  );
};

const StatusStep = ({
  onReviewActivity,
  onTradePerps,
  status,
}: {
  onReviewActivity: () => void;
  onTradePerps: () => void;
  status: HyperliquidDepositStatus;
}) => {
  const isConfirmed = status === 'confirmed';
  const isFailed = status === 'failed';

  return (
    <div className="hyperliquid-deposit__step hyperliquid-deposit__step--status">
      <PerpsGlyph success={isConfirmed} />
      <div className="hyperliquid-deposit__copy">
        <h1>{getStatusTitle(status)}</h1>
        <p>{getStatusCopy(status)}</p>
      </div>
      <FlowButton
        dataTestId="hyperliquid-deposit-status-button"
        onClick={isConfirmed ? onTradePerps : onReviewActivity}
      >
        {getStatusButtonText(status)}
      </FlowButton>
    </div>
  );
};

const HyperliquidDepositPage = () => {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { navigateToTransaction } = useConfirmationNavigation();
  const navigate = useNavigate();
  const { search } = useLocation();
  const transactionId = getTransactionIdFromSearch(search);
  const depositTransaction = useSelector((state) =>
    selectTransactionById(state, transactionId),
  );

  const [step, setStep] = useState<HyperliquidDepositStep>(() =>
    getStepFromSearch(search),
  );
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setStep(getStepFromSearch(search));
    setError(undefined);
    setIsSubmitting(false);
  }, [search]);

  const handleReviewDeposit = useCallback(async () => {
    if (!selectedAccount?.address) {
      setError('Select an account before funding Hyperliquid.');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const depositTransactionId = await createDepositConfirmationTransaction({
        from: selectedAccount.address as Hex,
      });

      navigateToTransaction(depositTransactionId, {
        goBackTo: getStatusRoute(depositTransactionId),
        loader: ConfirmationLoader.CustomAmount,
      });
    } catch (depositError) {
      setError(getErrorMessage(depositError));
      setIsSubmitting(false);
    }
  }, [navigateToTransaction, selectedAccount?.address]);

  return (
    <main className="hyperliquid-deposit">
      <section
        className="hyperliquid-deposit__panel"
        aria-label="Fund Hyperliquid Perps"
      >
        <CloseButton />
        {step === 'intro' ? (
          <IntroStep
            error={error}
            isSubmitting={isSubmitting}
            onContinue={handleReviewDeposit}
          />
        ) : null}
        {step === 'status' ? (
          <StatusStep
            onReviewActivity={() => navigate(PERPS_ACTIVITY_ROUTE)}
            onTradePerps={() => navigate(PERPS_MARKET_LIST_ROUTE)}
            status={getDepositStatus(depositTransaction?.status)}
          />
        ) : null}
      </section>
    </main>
  );
};

function getStepFromSearch(search: string): HyperliquidDepositStep {
  const step = new URLSearchParams(search).get('step');

  if (step === 'status' || step === 'success') {
    return 'status';
  }

  return 'intro';
}

function getTransactionIdFromSearch(search: string): string | undefined {
  return new URLSearchParams(search).get('txId') ?? undefined;
}

function getStatusRoute(transactionId: string): string {
  const searchParams = new URLSearchParams({
    step: 'status',
    txId: transactionId,
  });

  return `${HYPERLIQUID_DEPOSIT_ROUTE}?${searchParams.toString()}`;
}

function getDepositStatus(
  transactionStatus?: TransactionStatus,
): HyperliquidDepositStatus {
  if (transactionStatus === TransactionStatus.confirmed) {
    return 'confirmed';
  }

  if (
    transactionStatus === TransactionStatus.failed ||
    transactionStatus === TransactionStatus.dropped ||
    transactionStatus === TransactionStatus.rejected
  ) {
    return 'failed';
  }

  return 'pending';
}

function getStatusTitle(status: HyperliquidDepositStatus): string {
  if (status === 'confirmed') {
    return 'Wallet Funded';
  }

  if (status === 'failed') {
    return 'Deposit Failed';
  }

  return 'Deposit Submitted';
}

function getStatusButtonText(status: HyperliquidDepositStatus): string {
  if (status === 'confirmed') {
    return 'Trade Perps on MetaMask';
  }

  if (status === 'failed') {
    return 'Review activity';
  }

  return 'View activity';
}

function getStatusCopy(status: HyperliquidDepositStatus): string {
  if (status === 'confirmed') {
    return 'Your perps wallet is ready to trade on Hyperliquid.';
  }

  if (status === 'failed') {
    return 'The transaction did not complete. Review activity for details.';
  }

  return 'Your Arbitrum transaction is pending. We will mark this funded once it confirms.';
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

export default HyperliquidDepositPage;
