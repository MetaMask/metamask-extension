import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
} from '@metamask/design-system-react';

import {
  selectTransactionById,
  type TransactionState,
} from '../../selectors/transactionController';
import {
  PERPS_ACTIVITY_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../helpers/constants/routes';
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import { formatPerpsFiat } from '../../../shared/lib/perps-formatters';
import {
  HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC,
  HyperliquidDepositPrompt,
  HyperliquidLogo,
} from '../core/hyperliquid-deposit-prompt';

export { HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC };

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
  const navigate = useNavigate();
  const { search } = useLocation();
  const step = getStepFromSearch(search);
  const transactionId = getTransactionIdFromSearch(search);
  const depositTransaction = useSelector((state) =>
    selectTransactionById(state as TransactionState, transactionId),
  );
  const { account, isInitialLoading: isBalanceLoading } =
    usePerpsLiveAccount();

  if (step === 'intro') {
    return <HyperliquidDepositPrompt />;
  }

  return (
    <main className="hyperliquid-deposit">
      <section
        className="hyperliquid-deposit__panel"
        aria-label="Fund Hyperliquid Perps"
      >
        <CloseButton />
        <StatusStep
          currentBalance={account?.totalBalance}
          isBalanceLoading={isBalanceLoading}
          onReviewActivity={() => navigate(PERPS_ACTIVITY_ROUTE)}
          onTradePerps={() => navigate(PERPS_MARKET_LIST_ROUTE)}
          status={getDepositStatus(depositTransaction?.status)}
        />
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
    return 'Your perps wallet is ready to trade on Hyperliquid.';
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

export default HyperliquidDepositPage;
