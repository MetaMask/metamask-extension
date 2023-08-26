import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  TransactionStatus,
  TransactionType,
} from '../../../../shared/constants/transaction';
import createRandomId from '../../../../shared/modules/random-id';
import type {
  EtherscanTokenTransactionMeta,
  EtherscanTransactionMeta,
  EtherscanTransactionMetaBase,
  EtherscanTransactionResponse,
} from './etherscan';
import {
  fetchEtherscanTokenTransactions,
  fetchEtherscanTransactions,
} from './etherscan';
import { EtherscanRemoteTransactionSource } from './EtherscanRemoteTransactionSource';

jest.mock('./etherscan', () => ({
  fetchEtherscanTransactions: jest.fn(),
  fetchEtherscanTokenTransactions: jest.fn(),
}));

jest.mock('../../../../shared/modules/random-id');

const ID_MOCK = 123;

const ETHERSCAN_TRANSACTION_BASE_MOCK: EtherscanTransactionMetaBase = {
  blockNumber: '4535105',
  confirmations: '4',
  contractAddress: '',
  cumulativeGasUsed: '693910',
  from: '0x6bf137f335ea1b8f193b8f6ea92561a60d23a207',
  gas: '335208',
  gasPrice: '20000000000',
  gasUsed: '21000',
  hash: '0x342e9d73e10004af41d04973339fc7219dbadcbb5629730cfe65e9f9cb15ff91',
  nonce: '1',
  timeStamp: '1543596356',
  transactionIndex: '13',
  value: '50000000000000000',
  blockHash: '0x0000000001',
  to: '0x6bf137f335ea1b8f193b8f6ea92561a60d23a207',
};

const ETHERSCAN_TRANSACTION_SUCCESS_MOCK: EtherscanTransactionMeta = {
  ...ETHERSCAN_TRANSACTION_BASE_MOCK,
  functionName: 'testFunction',
  input: '0x',
  isError: '0',
  methodId: 'testId',
  txreceipt_status: '1',
};

const ETHERSCAN_TRANSACTION_ERROR_MOCK: EtherscanTransactionMeta = {
  ...ETHERSCAN_TRANSACTION_SUCCESS_MOCK,
  isError: '1',
};

const ETHERSCAN_TOKEN_TRANSACTION_MOCK: EtherscanTokenTransactionMeta = {
  ...ETHERSCAN_TRANSACTION_BASE_MOCK,
  tokenDecimal: '456',
  tokenName: 'TestToken',
  tokenSymbol: 'ABC',
};

const ETHERSCAN_TRANSACTION_RESPONSE_MOCK: EtherscanTransactionResponse<EtherscanTransactionMeta> =
  {
    result: [
      ETHERSCAN_TRANSACTION_SUCCESS_MOCK,
      ETHERSCAN_TRANSACTION_ERROR_MOCK,
    ],
  };

const ETHERSCAN_TOKEN_TRANSACTION_RESPONSE_MOCK: EtherscanTransactionResponse<EtherscanTokenTransactionMeta> =
  {
    result: [
      ETHERSCAN_TOKEN_TRANSACTION_MOCK,
      ETHERSCAN_TOKEN_TRANSACTION_MOCK,
    ],
  };

const ETHERSCAN_TRANSACTION_RESPONSE_EMPTY_MOCK: EtherscanTransactionResponse<EtherscanTransactionMeta> =
  {
    result: [],
  };

const ETHERSCAN_TOKEN_TRANSACTION_RESPONSE_EMPTY_MOCK: EtherscanTransactionResponse<EtherscanTokenTransactionMeta> =
  ETHERSCAN_TRANSACTION_RESPONSE_EMPTY_MOCK as any;

const EXPECTED_NORMALISED_TRANSACTION_BASE = {
  blockNumber: ETHERSCAN_TRANSACTION_SUCCESS_MOCK.blockNumber,
  chainId: undefined,
  hash: ETHERSCAN_TRANSACTION_SUCCESS_MOCK.hash,
  id: ID_MOCK,
  metamaskNetworkId: undefined,
  status: TransactionStatus.confirmed,
  time: 1543596356000,
  txParams: {
    from: ETHERSCAN_TRANSACTION_SUCCESS_MOCK.from,
    gas: '0x51d68',
    gasPrice: '0x4a817c800',
    nonce: '0x1',
    to: ETHERSCAN_TRANSACTION_SUCCESS_MOCK.to,
    value: '0xb1a2bc2ec50000',
  },
  type: TransactionType.incoming,
};

const EXPECTED_NORMALISED_TRANSACTION_SUCCESS = {
  ...EXPECTED_NORMALISED_TRANSACTION_BASE,
  txParams: {
    ...EXPECTED_NORMALISED_TRANSACTION_BASE.txParams,
    data: ETHERSCAN_TRANSACTION_SUCCESS_MOCK.input,
  },
};

const EXPECTED_NORMALISED_TRANSACTION_ERROR = {
  ...EXPECTED_NORMALISED_TRANSACTION_SUCCESS,
  status: TransactionStatus.failed,
};

const EXPECTED_NORMALISED_TOKEN_TRANSACTION = {
  ...EXPECTED_NORMALISED_TRANSACTION_BASE,
};

describe('EtherscanRemoteTransactionSource', () => {
  const fetchEtherscanTransactionsMock =
    fetchEtherscanTransactions as jest.MockedFn<
      typeof fetchEtherscanTransactions
    >;

  const fetchEtherscanTokenTransactionsMock =
    fetchEtherscanTokenTransactions as jest.MockedFn<
      typeof fetchEtherscanTokenTransactions
    >;

  const createIdMock = createRandomId as jest.MockedFn<typeof createRandomId>;

  beforeEach(() => {
    jest.resetAllMocks();

    fetchEtherscanTransactionsMock.mockResolvedValue(
      ETHERSCAN_TRANSACTION_RESPONSE_EMPTY_MOCK,
    );

    fetchEtherscanTokenTransactionsMock.mockResolvedValue(
      ETHERSCAN_TOKEN_TRANSACTION_RESPONSE_EMPTY_MOCK,
    );

    createIdMock.mockReturnValue(ID_MOCK);
  });

  describe('isSupportedNetwork', () => {
    it('returns true if chain ID in constant', () => {
      expect(
        new EtherscanRemoteTransactionSource().isSupportedNetwork(
          CHAIN_IDS.MAINNET,
          '1',
        ),
      ).toBe(true);
    });

    it('returns false if chain ID not in constant', () => {
      expect(
        new EtherscanRemoteTransactionSource().isSupportedNetwork(
          CHAIN_IDS.LOCALHOST,
          '1',
        ),
      ).toBe(false);
    });
  });

  describe('fetchTransactions', () => {
    it('returns normalized transactions fetched from Etherscan', async () => {
      fetchEtherscanTransactionsMock.mockResolvedValueOnce(
        ETHERSCAN_TRANSACTION_RESPONSE_MOCK,
      );

      const transactions =
        await new EtherscanRemoteTransactionSource().fetchTransactions(
          {} as any,
        );

      expect(transactions).toStrictEqual([
        EXPECTED_NORMALISED_TRANSACTION_SUCCESS,
        EXPECTED_NORMALISED_TRANSACTION_ERROR,
      ]);
    });

    it('returns normalized token transactions fetched from Etherscan', async () => {
      fetchEtherscanTokenTransactionsMock.mockResolvedValueOnce(
        ETHERSCAN_TOKEN_TRANSACTION_RESPONSE_MOCK,
      );

      const transactions =
        await new EtherscanRemoteTransactionSource().fetchTransactions(
          {} as any,
        );

      expect(transactions).toStrictEqual([
        EXPECTED_NORMALISED_TOKEN_TRANSACTION,
        EXPECTED_NORMALISED_TOKEN_TRANSACTION,
      ]);
    });

    it('returns no normalized token transactions if flag disabled', async () => {
      fetchEtherscanTokenTransactionsMock.mockResolvedValueOnce(
        ETHERSCAN_TOKEN_TRANSACTION_RESPONSE_MOCK,
      );

      const transactions = await new EtherscanRemoteTransactionSource({
        includeTokenTransfers: false,
      }).fetchTransactions({} as any);

      expect(transactions).toStrictEqual([]);
    });
  });
});
