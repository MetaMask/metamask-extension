import {
  TransactionStatus,
  type AuthorizationList,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  PaymentOverride,
  type GetPaymentOverrideDataRequest,
} from '@metamask/transaction-pay-controller';
import {
  buildMoneyAccountDepositBatch,
  buildMoneyAccountWithdrawBatch,
} from '@metamask/money-account-utils';
import type { Hex } from '@metamask/utils';
import { getDelegationTransaction } from '../../transaction/delegation';
import { getPaymentOverrideData } from './payment-override-callback';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  NETWORK_CLIENT_ID_MOCK,
  VAULT_CONFIG_MOCK,
} from './test-mocks';

jest.mock('@metamask/money-account-utils', () => ({
  ...jest.requireActual('@metamask/money-account-utils'),
  buildMoneyAccountDepositBatch: jest.fn(),
  buildMoneyAccountWithdrawBatch: jest.fn(),
}));
jest.mock('../../transaction/delegation', () => ({
  getDelegationTransaction: jest.fn(),
}));

const USER_EOA = '0x178239802520a9c99dcbd791f81326b70298d629' as Hex;
const DELEGATION_MANAGER = '0xdb9b1e94b5b69df7e401ddbede43491141047db3' as Hex;
const DELEGATION_DATA = '0xdelegation' as Hex;
const MOCK_AUTHORIZATION_LIST = [
  { chainId: '0x1' as Hex, nonce: '0x2' as Hex, yParity: '0x1' as Hex },
];

const MOCK_WITHDRAW_BATCH = {
  withdrawTx: {
    params: {
      to: VAULT_CONFIG_MOCK.tellerAddress,
      data: '0xwithdraw' as Hex,
      value: '0x0' as Hex,
    },
  },
  transferTx: {
    params: {
      to: VAULT_CONFIG_MOCK.underlyingToken,
      data: '0xtransfer' as Hex,
      value: '0x0' as Hex,
    },
  },
};

const MOCK_DEPOSIT_BATCH = {
  approveTx: {
    params: {
      to: VAULT_CONFIG_MOCK.underlyingToken,
      data: '0xapprove' as Hex,
      value: '0x0' as Hex,
    },
  },
  depositTx: {
    params: {
      to: VAULT_CONFIG_MOCK.tellerAddress,
      data: '0xdeposit' as Hex,
      value: '0x0' as Hex,
    },
  },
};

const AMOUNT_HUMAN = '10.5';
const AMOUNT_RAW = 10_500_000n;

const TRANSACTION_META_MOCK = {
  id: 'tx-1',
  txParams: { from: USER_EOA },
} as TransactionMeta;

const VALID_TX_DATA = {
  isLoading: false,
  paymentOverride: PaymentOverride.MoneyAccount,
  tokens: [],
};

const buildWithdrawBatchMock = jest.mocked(buildMoneyAccountWithdrawBatch);
const buildDepositBatchMock = jest.mocked(buildMoneyAccountDepositBatch);
const getDelegationTransactionMock = jest.mocked(getDelegationTransaction);

function buildRequest(
  overrides?: Partial<GetPaymentOverrideDataRequest>,
): GetPaymentOverrideDataRequest {
  return {
    amount: AMOUNT_HUMAN,
    transaction: TRANSACTION_META_MOCK,
    transactionData:
      VALID_TX_DATA as GetPaymentOverrideDataRequest['transactionData'],
    ...overrides,
  };
}

describe('getPaymentOverrideData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildWithdrawBatchMock.mockResolvedValue(MOCK_WITHDRAW_BATCH as never);
    buildDepositBatchMock.mockResolvedValue(MOCK_DEPOSIT_BATCH as never);
    getDelegationTransactionMock.mockResolvedValue({
      authorizationList: MOCK_AUTHORIZATION_LIST as AuthorizationList,
      data: DELEGATION_DATA,
      to: DELEGATION_MANAGER,
      value: '0x0' as Hex,
      type: '0x04' as never,
    });
  });

  it('returns empty calls when paymentOverride is not MoneyAccount', async () => {
    const { messenger } = createMoneyPayMessengerMock();

    const result = await getPaymentOverrideData(
      buildRequest({
        transactionData: {
          ...VALID_TX_DATA,
          paymentOverride: undefined,
        } as GetPaymentOverrideDataRequest['transactionData'],
      }),
      messenger,
    );

    expect(result).toStrictEqual({ calls: [] });
    expect(buildWithdrawBatchMock).not.toHaveBeenCalled();
  });

  it('throws when the money account is unavailable', async () => {
    const { messenger } = createMoneyPayMessengerMock({
      moneyAccountAddress: undefined,
    });

    await expect(
      getPaymentOverrideData(buildRequest(), messenger),
    ).rejects.toThrow('Money account payment override is not available');
    expect(buildWithdrawBatchMock).not.toHaveBeenCalled();
  });

  it('throws when the vault config is missing', async () => {
    const { messenger } = createMoneyPayMessengerMock({
      remoteFeatureFlags: {},
    });

    await expect(
      getPaymentOverrideData(buildRequest(), messenger),
    ).rejects.toThrow('Money account payment override is not available');
  });

  it('returns empty calls when the transaction has no from', async () => {
    const { messenger } = createMoneyPayMessengerMock();

    const result = await getPaymentOverrideData(
      buildRequest({
        transaction: { id: 'tx-1', txParams: {} } as TransactionMeta,
      }),
      messenger,
    );

    expect(result).toStrictEqual({ calls: [] });
  });

  it('builds the withdraw batch with the parsed amount and EOA recipient', async () => {
    const { messenger } = createMoneyPayMessengerMock();

    await getPaymentOverrideData(buildRequest(), messenger);

    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: AMOUNT_RAW,
        chainId: VAULT_CONFIG_MOCK.chainId,
        tellerAddress: VAULT_CONFIG_MOCK.tellerAddress,
        accountantAddress: VAULT_CONFIG_MOCK.accountantAddress,
        moneyAccountAddress: MONEY_ACCOUNT_ADDRESS_MOCK,
        recipient: USER_EOA,
      }),
    );
  });

  it('wraps withdraw calls in a delegation and returns the redeem call', async () => {
    const { messenger } = createMoneyPayMessengerMock();

    const result = await getPaymentOverrideData(buildRequest(), messenger);

    expect(getDelegationTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({ messenger }),
      expect.objectContaining({
        chainId: VAULT_CONFIG_MOCK.chainId,
        networkClientId: NETWORK_CLIENT_ID_MOCK,
        status: TransactionStatus.unapproved,
        id: expect.stringMatching(/^money-account-withdraw-\d+$/u),
        txParams: { from: MONEY_ACCOUNT_ADDRESS_MOCK },
        nestedTransactions: [
          {
            to: VAULT_CONFIG_MOCK.tellerAddress,
            data: '0xwithdraw',
            value: '0x0',
          },
          {
            to: VAULT_CONFIG_MOCK.underlyingToken,
            data: '0xtransfer',
            value: '0x0',
          },
        ],
      }),
    );
    expect(result).toStrictEqual({
      authorizationList: MOCK_AUTHORIZATION_LIST,
      calls: [
        {
          to: DELEGATION_MANAGER,
          data: DELEGATION_DATA,
          value: '0x0',
        },
      ],
    });
  });

  describe('non-atomic withdraw path', () => {
    function buildNonAtomicRequest(): GetPaymentOverrideDataRequest {
      return buildRequest({
        transactionData: {
          ...VALID_TX_DATA,
          atomic: false,
        } as GetPaymentOverrideDataRequest['transactionData'],
      });
    }

    it('returns raw withdraw and transfer calls without delegation wrap', async () => {
      const { messenger } = createMoneyPayMessengerMock();

      const result = await getPaymentOverrideData(
        buildNonAtomicRequest(),
        messenger,
      );

      expect(result).toStrictEqual({
        calls: [
          {
            to: VAULT_CONFIG_MOCK.tellerAddress,
            data: '0xwithdraw',
            value: '0x0',
          },
          {
            to: VAULT_CONFIG_MOCK.underlyingToken,
            data: '0xtransfer',
            value: '0x0',
          },
        ],
      });
    });

    it('does not call getDelegationTransaction on the non-atomic path', async () => {
      const { messenger } = createMoneyPayMessengerMock();

      await getPaymentOverrideData(buildNonAtomicRequest(), messenger);

      expect(getDelegationTransactionMock).not.toHaveBeenCalled();
    });
  });

  describe('isPostQuote deposit path', () => {
    function buildPostQuoteRequest(
      extra?: Record<string, unknown>,
    ): GetPaymentOverrideDataRequest {
      return buildRequest({
        transactionData: {
          ...VALID_TX_DATA,
          isPostQuote: true,
          ...extra,
        } as GetPaymentOverrideDataRequest['transactionData'],
      });
    }

    it('builds the deposit batch with vault config', async () => {
      const { messenger } = createMoneyPayMessengerMock();

      await getPaymentOverrideData(buildPostQuoteRequest(), messenger);

      expect(buildDepositBatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: AMOUNT_RAW,
          chainId: VAULT_CONFIG_MOCK.chainId,
          boringVault: VAULT_CONFIG_MOCK.boringVault,
          tellerAddress: VAULT_CONFIG_MOCK.tellerAddress,
          accountantAddress: VAULT_CONFIG_MOCK.accountantAddress,
          lensAddress: VAULT_CONFIG_MOCK.lensAddress,
        }),
      );
      expect(buildWithdrawBatchMock).not.toHaveBeenCalled();
    });

    it('returns deposit calls with delegation data and the money-account recipient', async () => {
      const { messenger } = createMoneyPayMessengerMock();

      const result = await getPaymentOverrideData(
        buildPostQuoteRequest(),
        messenger,
      );

      expect(result).toStrictEqual({
        recipient: MONEY_ACCOUNT_ADDRESS_MOCK,
        authorizationList: MOCK_AUTHORIZATION_LIST,
        calls: [
          {
            to: DELEGATION_MANAGER,
            data: DELEGATION_DATA,
            value: '0x0',
          },
        ],
      });
    });

    it('throws when the money account is unavailable', async () => {
      const { messenger } = createMoneyPayMessengerMock({
        moneyAccountAddress: undefined,
      });

      await expect(
        getPaymentOverrideData(buildPostQuoteRequest(), messenger),
      ).rejects.toThrow('Money account payment override is not available');
    });

    it('returns raw approve and deposit calls without delegation when non-atomic', async () => {
      const { messenger } = createMoneyPayMessengerMock();

      const result = await getPaymentOverrideData(
        buildPostQuoteRequest({ atomic: false }),
        messenger,
      );

      expect(result).toStrictEqual({
        recipient: MONEY_ACCOUNT_ADDRESS_MOCK,
        calls: [
          {
            to: VAULT_CONFIG_MOCK.underlyingToken,
            data: '0xapprove',
            value: '0x0',
          },
          {
            to: VAULT_CONFIG_MOCK.tellerAddress,
            data: '0xdeposit',
            value: '0x0',
          },
        ],
      });
      expect(getDelegationTransactionMock).not.toHaveBeenCalled();
    });
  });
});
