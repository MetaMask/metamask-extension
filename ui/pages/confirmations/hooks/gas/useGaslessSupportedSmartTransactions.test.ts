import { act } from 'react-dom/test-utils';
import { Hex } from '@metamask/utils';
import { getIsSmartTransaction } from '../../../../../shared/modules/selectors';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { isSendBundleSupported } from '../../../../store/actions';
import { useGaslessSupportedSmartTransactions } from './useGaslessSupportedSmartTransactions';

jest.mock('../../../../../shared/modules/selectors');
jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  isSendBundleSupported: jest.fn(),
}));

const CHAIN_ID_MOCK = '0x5';

async function runHook() {
  const { result } = renderHookWithConfirmContextProvider(
    useGaslessSupportedSmartTransactions,
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        chainId: CHAIN_ID_MOCK,
      }),
    ),
  );

  await act(async () => {
    // Intentionally empty
  });

  return result.current;
}

describe('useGaslessSupportedSmartTransactions', () => {
  const getIsSmartTransactionMock = jest.mocked(getIsSmartTransaction);
  const isSendBundleSupportedMock = jest.mocked(isSendBundleSupported);

  beforeEach(() => {
    jest.resetAllMocks();
    getIsSmartTransactionMock.mockReturnValue(false);
    isSendBundleSupportedMock.mockResolvedValue(false);
  });

  it('returns isSupported = true when smart transactions enabled and sendBundle supported', async () => {
    getIsSmartTransactionMock.mockReturnValue(true);
    isSendBundleSupportedMock.mockResolvedValue(true);

    const result = await runHook();

    expect(result).toStrictEqual({
      isSmartTransaction: true,
      isSupported: true,
      pending: false,
    });

    expect(isSendBundleSupportedMock).toHaveBeenCalledWith(
      CHAIN_ID_MOCK as Hex,
    );
  });

  it('returns isSupported = false when smart transaction enabled but sendBundle not supported', async () => {
    getIsSmartTransactionMock.mockReturnValue(true);
    isSendBundleSupportedMock.mockResolvedValue(false);

    const result = await runHook();

    expect(result).toStrictEqual({
      isSmartTransaction: true,
      isSupported: false,
      pending: false,
    });
  });

  it('returns isSupported = false when not a smart transaction', async () => {
    getIsSmartTransactionMock.mockReturnValue(false);
    isSendBundleSupportedMock.mockResolvedValue(true);

    const result = await runHook();

    expect(result).toStrictEqual({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });
  });

  it('returns pending = true while sendBundleSupported is being fetched', async () => {
    getIsSmartTransactionMock.mockReturnValue(true);
    // Simulate pending by not resolving the Promise yet
    let resolvePromise: (value: boolean) => void;
    const pendingPromise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
    isSendBundleSupportedMock.mockReturnValue(
      pendingPromise as Promise<boolean>,
    );

    const { result, waitForNextUpdate } = renderHookWithConfirmContextProvider(
      useGaslessSupportedSmartTransactions,
      getMockConfirmStateForTransaction(
        genUnapprovedContractInteractionConfirmation({
          chainId: CHAIN_ID_MOCK,
        }),
      ),
    );

    // Initially pending
    expect(result.current.pending).toBe(true);

    // Resolve and wait for next update
    await act(async () => {
      resolvePromise(true);
      await waitForNextUpdate();
    });

    expect(result.current).toStrictEqual({
      isSmartTransaction: true,
      isSupported: true,
      pending: false,
    });
  });

  it('returns false if chainId is missing', async () => {
    const { result } = renderHookWithConfirmContextProvider(
      useGaslessSupportedSmartTransactions,
      getMockConfirmStateForTransaction(
        genUnapprovedContractInteractionConfirmation({
          chainId: undefined,
        }),
      ),
    );

    await act(async () => {
      // Wait for useAsyncResult to settle
    });

    expect(result.current).toStrictEqual({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });
  });
});
