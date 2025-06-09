import { act } from 'react-dom/test-utils';
import { getIsSmartTransaction } from '../../../../../shared/modules/selectors';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { isAtomicBatchSupported } from '../../../../store/controller-actions/transaction-controller';
import { useIsGaslessSupported } from './useIsGaslessSupported';

jest.mock('../../../../../shared/modules/selectors');
jest.mock('../../../../store/controller-actions/transaction-controller');

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

  beforeEach(() => {
    jest.resetAllMocks();

    getIsSmartTransactionMock.mockReturnValue(false);
    isAtomicBatchSupportedMock.mockResolvedValue([]);

    process.env.TRANSACTION_RELAY_API_URL = 'test.com';
  });

  it('returns true if is smart transaction', async () => {
    getIsSmartTransactionMock.mockReturnValue(true);

    const result = await runHook();

    expect(result).toBe(true);
  });

  it('returns true if chain supports EIP-7702 and account is not upgraded', async () => {
    getIsSmartTransactionMock.mockReturnValue(false);
    isAtomicBatchSupportedMock.mockResolvedValue([
      {
        chainId: CHAIN_ID_MOCK,
        isSupported: false,
        delegationAddress: undefined,
      },
    ]);

    const result = await runHook();

    expect(result).toBe(true);
  });

  it('returns true if chain supports EIP-7702 and account is upgraded and supported', async () => {
    getIsSmartTransactionMock.mockReturnValue(false);
    isAtomicBatchSupportedMock.mockResolvedValue([
      {
        chainId: CHAIN_ID_MOCK,
        isSupported: true,
        delegationAddress: '0x123',
      },
    ]);

    const result = await runHook();

    expect(result).toBe(true);
  });

  it('returns false if not smart transaction and chain does not support EIP-7702', async () => {
    getIsSmartTransactionMock.mockReturnValue(false);
    isAtomicBatchSupportedMock.mockResolvedValue([]);

    const result = await runHook();

    expect(result).toBe(false);
  });

  it('returns false if not smart transaction and account is upgraded but not supported', async () => {
    getIsSmartTransactionMock.mockReturnValue(false);
    isAtomicBatchSupportedMock.mockResolvedValue([
      {
        chainId: CHAIN_ID_MOCK,
        isSupported: false,
        delegationAddress: '0x123',
      },
    ]);

    const result = await runHook();

    expect(result).toBe(false);
  });
});
