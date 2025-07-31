import { act } from 'react-dom/test-utils';
import { getIsSmartTransaction } from '../../../../../shared/modules/selectors';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { isAtomicBatchSupported } from '../../../../store/controller-actions/transaction-controller';
import {
  isRelaySupported,
  isSendBundleSupported,
} from '../../../../store/actions';
import { useIsGaslessSupported } from './useIsGaslessSupported';

jest.mock('../../../../../shared/modules/selectors');
jest.mock('../../../../store/controller-actions/transaction-controller');

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  isRelaySupported: jest.fn(),
  isSendBundleSupported: jest.fn(),
}));

const CHAIN_ID_MOCK = '0x5';

async function runHook() {
  const { result } = renderHookWithConfirmContextProvider(
    useIsGaslessSupported,
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation(),
    ),
  );

  await act(async () => {
    // Intentionally empty
  });

  return result.current;
}

describe('useIsGaslessSupported', () => {
  const getIsSmartTransactionMock = jest.mocked(getIsSmartTransaction);
  const isAtomicBatchSupportedMock = jest.mocked(isAtomicBatchSupported);
  const isRelaySupportedMock = jest.mocked(isRelaySupported);
  const isSendBundleSupportedMock = jest.mocked(isSendBundleSupported);

  beforeEach(() => {
    jest.resetAllMocks();

    getIsSmartTransactionMock.mockReturnValue(false);
    isAtomicBatchSupportedMock.mockResolvedValue([]);
    isRelaySupportedMock.mockResolvedValue(false);
    isSendBundleSupportedMock.mockResolvedValue(false);

    process.env.TRANSACTION_RELAY_API_URL = 'test.com';
  });

  it('returns true if is smart transaction', async () => {
    getIsSmartTransactionMock.mockReturnValue(true);

    const result = await runHook();

    expect(result).toStrictEqual({
      isSupported: true,
      isSmartTransaction: true,
    });
  });

  describe('if smart transaction disabled', () => {
    it('returns true if chain supports EIP-7702 and account is supported and relay supported and send bundle supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isRelaySupportedMock.mockResolvedValue(true);
      isSendBundleSupportedMock.mockResolvedValue(true);
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: CHAIN_ID_MOCK,
          isSupported: true,
          delegationAddress: '0x123',
        },
      ]);

      const result = await runHook();

      expect(result).toStrictEqual({
        isSupported: true,
        isSmartTransaction: false,
      });
    });

    it('returns false if account not upgraded', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isRelaySupportedMock.mockResolvedValue(true);
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: CHAIN_ID_MOCK,
          isSupported: false,
          delegationAddress: undefined,
        },
      ]);

      const result = await runHook();

      expect(result).toStrictEqual({
        isSupported: false,
        isSmartTransaction: false,
      });
    });

    it('returns false if chain does not support EIP-7702', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isRelaySupportedMock.mockResolvedValue(true);
      isAtomicBatchSupportedMock.mockResolvedValue([]);

      const result = await runHook();

      expect(result).toStrictEqual({
        isSupported: false,
        isSmartTransaction: false,
      });
    });

    it('returns false if upgraded account not supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isRelaySupportedMock.mockResolvedValue(true);
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: CHAIN_ID_MOCK,
          isSupported: false,
          delegationAddress: '0x123',
        },
      ]);

      const result = await runHook();

      expect(result).toStrictEqual({
        isSupported: false,
        isSmartTransaction: false,
      });
    });

    it('returns false if relay not supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isRelaySupportedMock.mockResolvedValue(false);
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: CHAIN_ID_MOCK,
          isSupported: true,
          delegationAddress: '0x123',
        },
      ]);

      const result = await runHook();

      expect(result).toStrictEqual({
        isSupported: false,
        isSmartTransaction: false,
      });
    });
  });
});
