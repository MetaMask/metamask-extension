import { TransactionType, type Transaction } from '@metamask/keyring-api';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { ActivityListItem } from '../../shared/lib/activity/types';
import { isUntrustedSender } from '../pages/details/hooks/useUntrustedSender';
import { selectKnownAddresses } from './known-addresses';

const tronAccount = 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3';
const tronSender = 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq';
const stellarAccount =
  'GDEM2RN4QLPSSPGSPSKSEQ3XXFGM4X4BRH4X4EOPABHAXBVV6OQ6YE6K';
const stellarSender =
  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

type NonEvmTransactions =
  MultichainTransactionsControllerState['nonEvmTransactions'];

function movement(address: string) {
  return { address } as Transaction['from'][number];
}

function transaction(
  type: TransactionType,
  from: string,
  to: string,
): Transaction {
  return {
    type,
    from: [movement(from)],
    to: [movement(to)],
  } as Transaction;
}

function buildState(nonEvmTransactions: NonEvmTransactions = {}) {
  return {
    metamask: {
      addressBook: {},
      internalAccounts: {
        accounts: {
          'tron-account': { address: tronAccount },
          'stellar-account': { address: stellarAccount },
        },
      },
      transactions: [],
      nonEvmTransactions,
    },
  } as unknown as Parameters<typeof selectKnownAddresses>[0];
}

function receiveItem(from: string): ActivityListItem {
  return {
    type: 'receive',
    status: 'success',
    chainId: 'tron:728126428',
    timestamp: 1,
    data: { from, to: tronAccount },
  };
}

describe('selectKnownAddresses', () => {
  it('includes internal non-EVM accounts', () => {
    const known = selectKnownAddresses(buildState());

    expect(known.has(tronAccount)).toBe(true);
    expect(known.has(stellarAccount)).toBe(true);
  });

  it('omits the sender of a receive', () => {
    const known = selectKnownAddresses(
      buildState({
        'tron-account': {
          'tron:728126428': {
            transactions: [
              transaction(TransactionType.Receive, tronSender, tronAccount),
            ],
          },
        },
        'stellar-account': {
          'stellar:pubnet': {
            transactions: [
              transaction(
                TransactionType.Receive,
                stellarSender,
                stellarAccount,
              ),
            ],
          },
        },
      }),
    );

    expect(known.has(tronSender)).toBe(false);
    expect(known.has(stellarSender)).toBe(false);
    expect(isUntrustedSender(receiveItem(tronSender), known)).toBe(true);
    expect(isUntrustedSender(receiveItem(stellarSender), known)).toBe(true);
  });

  it('includes an address the user sent to', () => {
    const known = selectKnownAddresses(
      buildState({
        'tron-account': {
          'tron:728126428': {
            transactions: [
              transaction(TransactionType.Send, tronAccount, tronSender),
            ],
          },
        },
        'stellar-account': {
          'stellar:pubnet': {
            transactions: [
              transaction(TransactionType.Send, stellarAccount, stellarSender),
            ],
          },
        },
      }),
    );

    expect(known.has(tronSender)).toBe(true);
    expect(known.has(stellarSender)).toBe(true);
    expect(isUntrustedSender(receiveItem(tronSender), known)).toBe(false);
    expect(isUntrustedSender(receiveItem(stellarSender), known)).toBe(false);
  });
});
