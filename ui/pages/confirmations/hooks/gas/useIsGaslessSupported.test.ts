import { act } from 'react-dom/test-utils';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { isAtomicBatchSupported } from '../../../../store/controller-actions/transaction-controller';
import { isRelaySupported } from '../../../../store/actions';
import { useIsGaslessSupported } from './useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from './useGaslessSupportedSmartTransactions';

jest.mock('../../../../../shared/modules/selectors');
jest.mock('../../../../store/controller-actions/transaction-controller');

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  isRelaySupported: jest.fn(),
}));

jest.mock('./useGaslessSupportedSmartTransactions');

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
  const isAtomicBatchSupportedMock = jest.mocked(isAtomicBatchSupported);
  const isRelaySupportedMock = jest.mocked(isRelaySupported);
  const useGaslessSupportedSmartTransactionsMock = jest.mocked(
    useGaslessSupportedSmartTransactions,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    isAtomicBatchSupportedMock.mockResolvedValue([]);
    isRelaySupportedMock.mockResolvedValue(false);
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });

    process.env.TRANSACTION_RELAY_API_URL = 'test.com';
  });

  it('returns true if is smart transaction and send bundle supported', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
      pending: false,
    });

    const result = await runHook();

    expect(result).toStrictEqual({
      isSupported: true,
      isSmartTransaction: true,
    });
  });

  describe('if smart transaction disabled', () => {
    it('returns true if chain supports EIP-7702 and account is supported and relay supported and send bundle supported', async () => {
      isRelaySupportedMock.mockResolvedValue(true);
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
      isRelaySupportedMock.mockResolvedValue(true);
      isAtomicBatchSupportedMock.mockResolvedValue([]);

      const result = await runHook();

      expect(result).toStrictEqual({
        isSupported: false,
        isSmartTransaction: false,
      });
    });

    it('returns false if upgraded account not supported', async () => {
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

  it('returns false if smart transaction is enabled but sendBundle is not supported', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: false,
      pending: false,
    });
    const result = await runHook();
    expect(result).toStrictEqual({
      isSupported: false,
      isSmartTransaction: true,
    });
  });

  it('returns false if atomic batch returns no matching chainId', async () => {
    isRelaySupportedMock.mockResolvedValue(true);
    isAtomicBatchSupportedMock.mockResolvedValue([
      { chainId: '0x1', isSupported: true, delegationAddress: '0x123' },
    ]);
    const result = await runHook();
    expect(result).toStrictEqual({
      isSupported: false,
      isSmartTransaction: false,
    });
  });

  it('returns pending state when useGaslessSupportedSmartTransactions is pending', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: false,
      pending: true,
    });

    // these mocks shouldn't be called when pending is true
    isAtomicBatchSupportedMock.mockResolvedValue([
      {
        chainId: CHAIN_ID_MOCK,
        isSupported: true,
        delegationAddress: '0x123',
      },
    ]);
    isRelaySupportedMock.mockResolvedValue(true);

    const result = await runHook();

    // since pending=true, 7702 eligibility shouldn't be checked yet
    expect(isAtomicBatchSupportedMock).not.toHaveBeenCalled();
    expect(isRelaySupportedMock).not.toHaveBeenCalled();

    expect(result).toStrictEqual({
      isSupported: false,
      isSmartTransaction: true,
    });
  });
});
