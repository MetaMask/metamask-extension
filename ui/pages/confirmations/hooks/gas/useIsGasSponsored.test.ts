import {
  TransactionStatus,
  TransactionType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { useIsNetworkGasSponsored } from '../../../../hooks/useIsNetworkGasSponsored';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { useIsGaslessSupported } from './useIsGaslessSupported';
import { useIsGasSponsored } from './useIsGasSponsored';

jest.mock('./useIsGaslessSupported');
jest.mock('../../../../hooks/useIsNetworkGasSponsored');

const MOCK_TRANSACTION_META = {
  id: '1',
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
  chainId: '0x1',
  simulationFails: undefined,
} as unknown as TransactionMeta;

const mockUseIsNetworkGasSponsored = jest.mocked(useIsNetworkGasSponsored);
const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useIsGasSponsored,
    state,
  );

  return response.result.current;
}

describe('useIsGasSponsored', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsNetworkGasSponsored.mockReturnValue({
      isNetworkGasSponsored: false,
    });
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: false,
      pending: false,
      isSmartTransaction: false,
    });
  });

  it('returns true when network is gas sponsored and gasless enabled', () => {
    mockUseIsNetworkGasSponsored.mockReturnValue({
      isNetworkGasSponsored: true,
    });
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      pending: false,
      isSmartTransaction: false,
    });
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...MOCK_TRANSACTION_META,
        }),
      ),
    ).toBe(true);
  });

  it('returns false when network is gas sponsored and gasless disabled', () => {
    mockUseIsNetworkGasSponsored.mockReturnValue({
      isNetworkGasSponsored: true,
    });
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: false,
      pending: false,
      isSmartTransaction: false,
    });
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...MOCK_TRANSACTION_META,
        }),
      ),
    ).toBe(false);
  });

  it('returns false when network is NOT gas sponsored and gasless enabled', () => {
    mockUseIsNetworkGasSponsored.mockReturnValue({
      isNetworkGasSponsored: false,
    });
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      pending: false,
      isSmartTransaction: false,
    });
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...MOCK_TRANSACTION_META,
        }),
      ),
    ).toBe(false);
  });

  it('returns false when transaction metadata is empty', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({} as unknown as TransactionMeta),
      ),
    ).toBe(false);
  });
});
