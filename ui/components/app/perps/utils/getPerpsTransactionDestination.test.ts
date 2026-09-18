import {
  PERPS_TRANSACTION_DETAILS_ROUTE,
  TX_DETAILS_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  FillType,
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
  type PerpsTransaction,
} from '../types';
import { getPerpsTransactionDestination } from './getPerpsTransactionDestination';

const createTradeTransaction = (): PerpsTransaction => ({
  id: 'tx-trade',
  type: 'trade',
  category: 'position_open',
  symbol: 'ETH',
  title: 'Opened long',
  subtitle: '2.5 ETH @ $2,850.00',
  timestamp: Date.now(),
  fill: {
    shortTitle: 'Opened long',
    amount: '+$7,125.00',
    amountNumber: 7125,
    isPositive: true,
    size: '2.5',
    entryPrice: '2850.00',
    points: '0',
    pnl: '0',
    fee: '7.13',
    action: 'Opened',
    feeToken: 'USDC',
    fillType: FillType.Standard,
  },
});

const createOrderTransaction = (): PerpsTransaction => ({
  id: 'tx-order',
  type: 'order',
  category: 'limit_order',
  symbol: 'SOL',
  title: 'Limit long',
  subtitle: '25 SOL @ $95.00',
  timestamp: Date.now(),
  order: {
    text: PerpsOrderTransactionStatus.Open,
    statusType: PerpsOrderTransactionStatusType.Pending,
    type: 'limit',
    size: '$2,375.00',
    limitPrice: '95.00',
    filled: '0%',
  },
});

const createFundingTransaction = (): PerpsTransaction => ({
  id: 'tx-funding',
  type: 'funding',
  category: 'funding_fee',
  symbol: 'ETH',
  title: 'Received funding fee',
  subtitle: 'ETH',
  timestamp: Date.now(),
  fundingAmount: {
    isPositive: true,
    fee: '+$8.30',
    feeNumber: 8.3,
    rate: '0.01%',
  },
});

const createDepositTransaction = (
  txHash = '0x1234567890abcdef1234567890abcdef12345678',
): PerpsTransaction => ({
  id: 'tx-deposit',
  type: 'deposit',
  category: 'deposit',
  symbol: 'USDC',
  title: 'Deposited 5000 USDC',
  subtitle: 'Completed',
  timestamp: Date.now(),
  depositWithdrawal: {
    amount: '+$5,000.00',
    amountNumber: 5000,
    isPositive: true,
    asset: 'USDC',
    txHash,
    status: 'completed',
    type: 'deposit',
  },
});

const createWithdrawalTransaction = (
  txHash = '0xabcdef1234567890abcdef1234567890abcdef12',
): PerpsTransaction => ({
  id: 'tx-withdrawal',
  type: 'withdrawal',
  category: 'withdrawal',
  symbol: 'USDC',
  title: 'Withdrew 2000 USDC',
  subtitle: 'Completed',
  timestamp: Date.now(),
  depositWithdrawal: {
    amount: '-$2,000.00',
    amountNumber: 2000,
    isPositive: false,
    asset: 'USDC',
    txHash,
    status: 'completed',
    type: 'withdrawal',
  },
});

describe('getPerpsTransactionDestination', () => {
  it('routes trade transactions to the Perps transaction details page with the transaction in state', () => {
    const transaction = createTradeTransaction();

    expect(getPerpsTransactionDestination(transaction)).toEqual({
      pathname: PERPS_TRANSACTION_DETAILS_ROUTE,
      state: { transaction },
    });
  });

  it('routes order transactions to the Perps transaction details page with the transaction in state', () => {
    const transaction = createOrderTransaction();

    expect(getPerpsTransactionDestination(transaction)).toEqual({
      pathname: PERPS_TRANSACTION_DETAILS_ROUTE,
      state: { transaction },
    });
  });

  it('routes funding transactions to the Perps transaction details page with the transaction in state', () => {
    const transaction = createFundingTransaction();

    expect(getPerpsTransactionDestination(transaction)).toEqual({
      pathname: PERPS_TRANSACTION_DETAILS_ROUTE,
      state: { transaction },
    });
  });

  it('routes deposit transactions to the generic tx details route using the Arbitrum caip chain id and tx hash', () => {
    const transaction = createDepositTransaction();

    const destination = getPerpsTransactionDestination(transaction);

    expect(destination).toEqual({
      pathname: `${TX_DETAILS_ROUTE}/eip155:42161/${transaction.depositWithdrawal?.txHash}`,
    });
    expect(destination?.state).toBeUndefined();
  });

  it('routes withdrawal transactions to the generic tx details route using the Arbitrum caip chain id and tx hash', () => {
    const transaction = createWithdrawalTransaction();

    const destination = getPerpsTransactionDestination(transaction);

    expect(destination).toEqual({
      pathname: `${TX_DETAILS_ROUTE}/eip155:42161/${transaction.depositWithdrawal?.txHash}`,
    });
  });

  it('returns undefined for a deposit transaction missing a tx hash', () => {
    const transaction = createDepositTransaction('');

    expect(getPerpsTransactionDestination(transaction)).toBeUndefined();
  });

  it('returns undefined for a withdrawal transaction missing depositWithdrawal info', () => {
    const transaction: PerpsTransaction = {
      ...createWithdrawalTransaction(),
      depositWithdrawal: undefined,
    };

    expect(getPerpsTransactionDestination(transaction)).toBeUndefined();
  });
});
