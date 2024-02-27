import {
  TransactionParams,
  normalizeTxParams,
} from '@metamask/transaction-controller';
import { normalizePPOMRequest } from './ppom-util';

jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  normalizeTxParams: jest.fn(),
}));

const TRANSACTION_PARAMS_MOCK_1: TransactionParams = {
  data: '0xabcd',
  from: '0x1234',
};

const TRANSACTION_PARAMS_MOCK_2: TransactionParams = {
  data: '0xabcde',
  from: '0x12345',
};

const REQUEST_SIGNATURE_MOCK = {
  method: 'eth_signTypedData_v4',
  params: [],
};

const REQUEST_TRANSACTION_MOCK = {
  method: 'eth_sendTransaction',
  params: [TRANSACTION_PARAMS_MOCK_1],
};

describe('PPOM Utils', () => {
  const normalizeTxParamsMock = jest.mocked(normalizeTxParams);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('normalizePPOMRequest', () => {
    it('returns same request if method is not eth_sendTransaction', () => {
      expect(normalizePPOMRequest(REQUEST_SIGNATURE_MOCK)).toBe(
        REQUEST_SIGNATURE_MOCK,
      );
    });

    it('returns normalized request if method is eth_sendTransaction', () => {
      normalizeTxParamsMock.mockReturnValue(TRANSACTION_PARAMS_MOCK_2);

      expect(normalizePPOMRequest(REQUEST_TRANSACTION_MOCK)).toStrictEqual(
        expect.objectContaining({ params: [TRANSACTION_PARAMS_MOCK_2] }),
      );

      expect(normalizeTxParamsMock).toHaveBeenCalledTimes(1);
      expect(normalizeTxParamsMock).toHaveBeenCalledWith(
        TRANSACTION_PARAMS_MOCK_1,
      );
    });
  });
});
