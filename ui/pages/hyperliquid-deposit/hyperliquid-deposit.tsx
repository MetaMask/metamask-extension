import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
} from '@metamask/design-system-react';

import { getSelectedInternalAccount } from '../../selectors';
import {
  selectTransactionById,
  type TransactionState,
} from '../../selectors/transactionController';
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
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import { formatPerpsFiat } from '../../../shared/lib/perps-formatters';

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

const HyperliquidLogo = ({ success = false }: { success?: boolean }) => {
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

const PendingStatusIndicator = () => {
  return (
    <div
      aria-label="Waiting for confirmation"
      className="hyperliquid-deposit__pending-loader"
      role="status"
    >
      <DsIcon
        className="hyperliquid-deposit__pending-loader-icon"
        color={DsIconColor.IconDefault}
        name={DsIconName.Loading}
        size={DsIconSize.Lg}
      />
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
      <HyperliquidLogo />
      <div className="hyperliquid-deposit__copy">
        <h1>Deposit to Hyperliquid</h1>
        <p>Fund your Hyperliquid account with any token from MetaMask.</p>
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

const BalanceRow = ({
  currentBalance,
  isBalanceLoading,
}: {
  currentBalance?: string;
  isBalanceLoading: boolean;
}) => {
  return (
    <div
      className="hyperliquid-deposit__balance-row"
      data-testid="hyperliquid-deposit-balance-row"
    >
      <span>Current balance</span>
      <strong>{getBalanceText({ currentBalance, isBalanceLoading })}</strong>
    </div>
  );
};

const StatusStep = ({
  currentBalance,
  isBalanceLoading,
  onReviewActivity,
  onTradePerps,
  status,
}: {
  currentBalance?: string;
  isBalanceLoading: boolean;
  onReviewActivity: () => void;
  onTradePerps: () => void;
  status: HyperliquidDepositStatus;
}) => {
  const isConfirmed = status === 'confirmed';
  const isFailed = status === 'failed';

  return (
    <div className="hyperliquid-deposit__step hyperliquid-deposit__step--status">
      <HyperliquidLogo success={isConfirmed} />
      <div className="hyperliquid-deposit__copy">
        <h1>{getStatusTitle(status)}</h1>
        <p>{getStatusCopy(status)}</p>
      </div>
      {!isConfirmed && !isFailed ? <PendingStatusIndicator /> : null}
      {isConfirmed ? (
        <BalanceRow
          currentBalance={currentBalance}
          isBalanceLoading={isBalanceLoading}
        />
      ) : null}
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
    selectTransactionById(state as TransactionState, transactionId),
  );
  const { account, isInitialLoading: isBalanceLoading } =
    usePerpsLiveAccount();

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
            currentBalance={account?.totalBalance}
            isBalanceLoading={isBalanceLoading}
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
    return 'Account Funded';
  }

  if (status === 'failed') {
    return 'Deposit Failed';
  }

  return 'Deposit Pending';
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
    return 'Your Hyperliquid account has been funded and is ready for trading.';
  }

  if (status === 'failed') {
    return 'The transaction did not complete. Review activity for details.';
  }

  return "Your deposit is on its way. We'll update this screen once the funds are available in Hyperliquid.";
}

function getBalanceText({
  currentBalance,
  isBalanceLoading,
}: {
  currentBalance?: string;
  isBalanceLoading: boolean;
}): string {
  if (isBalanceLoading) {
    return 'Loading...';
  }

  if (currentBalance === undefined) {
    return 'Unavailable';
  }

  const parsedBalance = Number.parseFloat(currentBalance);
  if (!Number.isFinite(parsedBalance)) {
    return 'Unavailable';
  }

  if (parsedBalance === 0) {
    return 'Updating...';
  }

  return formatPerpsFiat(currentBalance);
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
