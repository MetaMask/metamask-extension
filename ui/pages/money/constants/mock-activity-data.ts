import {
  type TransactionMeta,
  type TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/chain-ids';
import {
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
} from '../../../components/app/musd/constants';

/**
 * When set on mock {@link TransactionMeta}, overrides the default title from
 * {@link TransactionType}.
 */
export type MoneyActivityTitleKey =
  | 'deposited'
  | 'received'
  | 'converted'
  | 'sent';

/**
 * {@link TransactionMeta} plus optional Money activity presentation fields.
 */
export type MoneyActivityTransactionMeta = TransactionMeta & {
  moneySubtitle?: string;
  moneyActivityTitleKey?: MoneyActivityTitleKey;
};

export const MOCK_CHAIN_ID = CHAIN_IDS.MONAD as Hex;

export const MOCK_NETWORK_CLIENT_ID = 'monad';

const defaultTxParams = {
  from: '0x0000000000000000000000000000000000000001',
  to: '0x0000000000000000000000000000000000000002',
  value: '0x0',
} as unknown as TransactionParams;

function makeMoneyTx(config: {
  id: string;
  /** Unix time in seconds (matches mobile mock fixtures). */
  timestampSec: number;
  type: TransactionType;
  amount: string;
  status?: TransactionStatus;
  symbol?: string;
  moneySubtitle?: string;
  moneyActivityTitleKey?: MoneyActivityTitleKey;
}): MoneyActivityTransactionMeta {
  const {
    id,
    timestampSec,
    type,
    amount,
    status = TransactionStatus.confirmed,
    symbol = MUSD_TOKEN.symbol,
    moneySubtitle,
    moneyActivityTitleKey,
  } = config;

  const tx: MoneyActivityTransactionMeta = {
    id,
    chainId: MOCK_CHAIN_ID,
    networkClientId: MOCK_NETWORK_CLIENT_ID,
    status,
    time: timestampSec * 1000,
    txParams: defaultTxParams,
    type,
    transferInformation: {
      amount,
      contractAddress: MUSD_TOKEN_ADDRESS,
      decimals: MUSD_TOKEN.decimals,
      symbol,
    },
    moneySubtitle,
    moneyActivityTitleKey,
  };

  return tx;
}

const MOCK_MONEY_TRANSACTIONS: MoneyActivityTransactionMeta[] = [
  makeMoneyTx({
    id: 'money-tx-deposited',
    timestampSec: 1747094400,
    type: TransactionType.moneyAccountDeposit,
    amount: '1000000000',
    moneySubtitle: 'Transak',
    moneyActivityTitleKey: 'deposited',
  }),
  makeMoneyTx({
    id: 'money-tx-converted-eth',
    timestampSec: 1747094100,
    type: TransactionType.moneyAccountDeposit,
    amount: '1000000000',
    moneySubtitle: 'ETH → mUSD',
    moneyActivityTitleKey: 'converted',
  }),
  makeMoneyTx({
    id: 'money-tx-sent-usdc',
    timestampSec: 1747093800,
    type: TransactionType.moneyAccountWithdraw,
    amount: '250000000',
    moneySubtitle: 'mUSD → USDC',
    moneyActivityTitleKey: 'sent',
  }),
  makeMoneyTx({
    id: 'money-tx-received-2',
    timestampSec: 1747093500,
    type: TransactionType.incoming,
    amount: '500000000',
    moneySubtitle: 'From: 0xAbCdE...Fg123',
    moneyActivityTitleKey: 'received',
  }),
  makeMoneyTx({
    id: 'money-tx-deposit-failed',
    timestampSec: 1747090800,
    type: TransactionType.moneyAccountDeposit,
    amount: '1000000000',
    status: TransactionStatus.failed,
    moneySubtitle: 'Transak',
    moneyActivityTitleKey: 'deposited',
  }),
  makeMoneyTx({
    id: 'money-tx-send-failed',
    timestampSec: 1747090200,
    type: TransactionType.moneyAccountWithdraw,
    amount: '250000000',
    status: TransactionStatus.failed,
    moneySubtitle: 'mUSD → USDC',
    moneyActivityTitleKey: 'sent',
  }),
  makeMoneyTx({
    id: 'money-tx-converted',
    timestampSec: 1747008000,
    type: TransactionType.moneyAccountDeposit,
    amount: '1000000000',
    moneySubtitle: 'USDC → mUSD',
    moneyActivityTitleKey: 'converted',
  }),
  makeMoneyTx({
    id: 'money-tx-deposited-fiat',
    timestampSec: 1747004400,
    type: TransactionType.moneyAccountDeposit,
    amount: '1000000000',
    moneySubtitle: 'Transak',
    moneyActivityTitleKey: 'deposited',
  }),
  makeMoneyTx({
    id: 'money-tx-deposited-apple-pay',
    timestampSec: 1747004100,
    type: TransactionType.moneyAccountDeposit,
    amount: '1000000000',
    moneySubtitle: 'Apple Pay',
    moneyActivityTitleKey: 'deposited',
  }),
  makeMoneyTx({
    id: 'money-tx-deposited-musd',
    timestampSec: 1747000800,
    type: TransactionType.moneyAccountDeposit,
    amount: '500000000',
    moneySubtitle: 'mUSD',
    moneyActivityTitleKey: 'deposited',
  }),
  makeMoneyTx({
    id: 'money-tx-received',
    timestampSec: 1746997200,
    type: TransactionType.incoming,
    amount: '1000000000',
    moneySubtitle: 'From: 0x23231...12345',
    moneyActivityTitleKey: 'received',
  }),
  makeMoneyTx({
    id: 'money-tx-sent',
    timestampSec: 1746993600,
    type: TransactionType.moneyAccountWithdraw,
    amount: '250000000',
    moneySubtitle: 'mUSD → USDC',
    moneyActivityTitleKey: 'sent',
  }),
];

export default MOCK_MONEY_TRANSACTIONS;
