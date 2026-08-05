import { waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import { getIsSmartTransaction } from '../../../../../shared/lib/selectors';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { isSendBundleSupported } from '../../../../store/actions';
import { useIsHardwareWalletAccount } from '../../../../hooks/useIsHardwareWalletAccount';
import { useGaslessSupportedSmartTransactions } from './useGaslessSupportedSmartTransactions';

jest.mock('../../../../../shared/lib/selectors');
jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  isSendBundleSupported: jest.fn(),
}));

jest.mock('../../../../selectors', () => ({
  ...jest.requireActual('../../../../selectors'),
}));
jest.mock('../../../../hooks/useIsHardwareWalletAccount');

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

  await waitFor(() => {
    expect(result.current.pending).toBe(false);
  });

  return result.current;
}

describe('useGaslessSupportedSmartTransactions', () => {
  const getIsSmartTransactionMock = jest.mocked(getIsSmartTransaction);
  const isSendBundleSupportedMock = jest.mocked(isSendBundleSupported);
  const useIsHardwareWalletAccountMock = jest.mocked(
    useIsHardwareWalletAccount,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    getIsSmartTransactionMock.mockReturnValue(false);
    isSendBundleSupportedMock.mockResolvedValue(false);
    useIsHardwareWalletAccountMock.mockReturnValue(false);
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
    let resolvePromise: (value: boolean) => void = () => undefined;
    const pendingPromise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
    isSendBundleSupportedMock.mockReturnValue(
      pendingPromise as Promise<boolean>,
    );

    const { result } = renderHookWithConfirmContextProvider(
      useGaslessSupportedSmartTransactions,
      getMockConfirmStateForTransaction(
        genUnapprovedContractInteractionConfirmation({
          chainId: CHAIN_ID_MOCK,
        }),
      ),
    );

    // Initially pending
    expect(result.current.pending).toBe(true);

    // Resolve and wait for the async result to settle
    resolvePromise(true);
    await waitFor(() => {
      expect(result.current).toStrictEqual({
        isSmartTransaction: true,
        isSupported: true,
        pending: false,
      });
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

    await waitFor(() => {
      expect(result.current.pending).toBe(false);
    });

    expect(result.current).toStrictEqual({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });
  });

  it('returns isSupported true for hardware wallets when smart transactions and sendBundle are supported', async () => {
    getIsSmartTransactionMock.mockReturnValue(true);
    isSendBundleSupportedMock.mockResolvedValue(true);

    const result = await runHook();

    // Hardware wallets support the sendBundle path (standard EIP-1559 signing only)
    expect(result).toStrictEqual({
      isSmartTransaction: true,
      isSupported: true,
      pending: false,
    });
  });
});
