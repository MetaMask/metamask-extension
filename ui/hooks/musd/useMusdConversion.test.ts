import { renderHook, act } from '@testing-library/react-hooks';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { ConvertibleToken } from '../../pages/musd/types';
import { MUSD_CONVERSION_EDUCATION_ROUTE } from '../../pages/musd/constants/routes';
import { useMusdConversion } from './useMusdConversion';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../selectors/musd', () => ({
  selectIsMusdConversionFlowEnabled: jest.fn(),
  selectMusdConversionEducationSeen: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('../../selectors/transactions', () => ({
  getUnapprovedTransactions: jest.fn(),
}));

const mockAddTransaction = jest.fn();
const mockFindNetworkClientIdByChainId = jest.fn();
const mockSetMusdConversionEducationSeen = jest.fn();

jest.mock('../../store/actions', () => ({
  addTransaction: (...args: unknown[]) => mockAddTransaction(...args),
  findNetworkClientIdByChainId: (...args: unknown[]) =>
    mockFindNetworkClientIdByChainId(...args),
  setMusdConversionEducationSeen: (...args: unknown[]) =>
    mockSetMusdConversionEducationSeen(...args),
}));

const mockUpdateTransactionPaymentToken = jest.fn();

jest.mock('../../store/controller-actions/transaction-pay-controller', () => ({
  updateTransactionPaymentToken: (...args: unknown[]) =>
    mockUpdateTransactionPaymentToken(...args),
}));

const mockBuildMusdConversionTx = jest.fn();
const mockIsMatchingMusdConversion = jest.fn();

jest.mock('../../components/app/musd/utils', () => ({
  buildMusdConversionTx: (...args: unknown[]) =>
    mockBuildMusdConversionTx(...args),
  isMatchingMusdConversion: (...args: unknown[]) =>
    mockIsMatchingMusdConversion(...args),
}));

jest.mock('../../components/app/musd/constants', () => ({
  MUSD_CONVERSION_DEFAULT_CHAIN_ID: '0x1',
}));

jest.mock('../../pages/confirmations/hooks/useConfirmationNavigation', () => ({
  ConfirmationLoader: { CustomAmount: 'customAmount' },
}));

jest.mock('./useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: jest.fn(() => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
  })),
}));

const { useSelector } = jest.requireMock('react-redux');
const { useMusdGeoBlocking } = jest.requireMock('./useMusdGeoBlocking');
const { getSelectedInternalAccount } = jest.requireMock('../../selectors');
const { getUnapprovedTransactions } = jest.requireMock(
  '../../selectors/transactions',
);
const { selectMusdConversionEducationSeen, selectIsMusdConversionFlowEnabled } =
  jest.requireMock('../../selectors/musd');

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_TX_ID = 'tx-abc-123';

type SelectorMap = {
  selectedAccount: { address: string } | null;
  unapprovedTransactions: Record<string, Partial<TransactionMeta>>;
  educationSeen: boolean;
  isFeatureEnabled: boolean;
};

function setupSelectors(overrides: Partial<SelectorMap> = {}) {
  const defaults: SelectorMap = {
    selectedAccount: { address: MOCK_ADDRESS },
    unapprovedTransactions: {},
    educationSeen: true,
    isFeatureEnabled: true,
    ...overrides,
  };

  useSelector.mockImplementation((selector: (state: unknown) => unknown) => {
    if (selector === getSelectedInternalAccount) {
      return defaults.selectedAccount;
    }
    if (selector === getUnapprovedTransactions) {
      return defaults.unapprovedTransactions;
    }
    if (selector === selectMusdConversionEducationSeen) {
      return defaults.educationSeen;
    }
    if (selector === selectIsMusdConversionFlowEnabled) {
      return defaults.isFeatureEnabled;
    }
    return undefined;
  });
}

describe('useMusdConversion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSelectors();

    mockFindNetworkClientIdByChainId.mockResolvedValue('mainnet');
    mockBuildMusdConversionTx.mockReturnValue({
      txParams: { to: '0x1', from: MOCK_ADDRESS, value: '0x0' },
      addTxOptions: { type: TransactionType.musdConversion },
    });
    mockAddTransaction.mockResolvedValue({ id: MOCK_TX_ID });
    mockIsMatchingMusdConversion.mockReturnValue(false);
    mockUpdateTransactionPaymentToken.mockResolvedValue(undefined);
  });

  describe('return shape', () => {
    it('exposes expected properties', () => {
      const { result } = renderHook(() => useMusdConversion());

      expect(result.current).toEqual(
        expect.objectContaining({
          educationSeen: expect.any(Boolean),
          isFeatureEnabled: expect.any(Boolean),
          isUserGeoBlocked: expect.any(Boolean),
          isGeoLoading: expect.any(Boolean),
          startConversionFlow: expect.any(Function),
          cancelConversion: expect.any(Function),
          markEducationSeen: expect.any(Function),
          error: null,
        }),
      );
    });
  });

  describe('startConversionFlow', () => {
    it('returns early when feature is disabled', async () => {
      setupSelectors({ isFeatureEnabled: false });

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('returns early when geo-blocking check is still loading', async () => {
      useMusdGeoBlocking.mockReturnValue({
        isBlocked: false,
        userCountry: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();

      useMusdGeoBlocking.mockReturnValue({
        isBlocked: false,
        userCountry: 'US',
        isLoading: false,
      });
    });

    it('returns early when user is geo-blocked', async () => {
      useMusdGeoBlocking.mockReturnValue({
        isBlocked: true,
        userCountry: 'GB',
        isLoading: false,
      });

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();

      useMusdGeoBlocking.mockReturnValue({
        isBlocked: false,
        userCountry: 'US',
        isLoading: false,
      });
    });

    it('navigates to education route when education not seen and skipEducation is false', async () => {
      setupSelectors({ educationSeen: false });

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        MUSD_CONVERSION_EDUCATION_ROUTE,
      );
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('skips education when skipEducation option is true', async () => {
      setupSelectors({ educationSeen: false });

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow({ skipEducation: true });
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/musd/education');
      expect(mockAddTransaction).toHaveBeenCalled();
    });

    it('returns early when no selected address', async () => {
      setupSelectors({ selectedAccount: null });

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(mockAddTransaction).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('reuses existing pending conversion and navigates to confirm', async () => {
      const existingTx = {
        id: 'existing-tx-id',
        type: TransactionType.musdConversion,
      };
      setupSelectors({
        unapprovedTransactions: { 'existing-tx-id': existingTx },
      });
      mockIsMatchingMusdConversion.mockReturnValue(true);

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(mockAddTransaction).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/confirm-transaction/existing-tx-id',
        }),
      );
    });

    it('creates a new transaction and navigates to confirm', async () => {
      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
      expect(mockBuildMusdConversionTx).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: '0x1',
          fromAddress: MOCK_ADDRESS,
          amountHex: '0x0',
          networkClientId: 'mainnet',
        }),
      );
      expect(mockAddTransaction).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: `/confirm-transaction/${MOCK_TX_ID}`,
          search: 'loader=customAmount',
        }),
      );
    });

    it('calls updateTransactionPaymentToken when preferredToken has address', async () => {
      const preferredToken: ConvertibleToken = {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: '0x1',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: '0x0',
        fiatBalance: '100',
      };

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow({ preferredToken });
      });

      expect(mockUpdateTransactionPaymentToken).toHaveBeenCalledWith({
        transactionId: MOCK_TX_ID,
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: '0x1',
      });
    });

    it('uses preferredToken chainId when provided', async () => {
      const preferredToken: ConvertibleToken = {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: '0xe708',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: '0x0',
        fiatBalance: '100',
      };

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow({ preferredToken });
      });

      expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0xe708');
    });

    it('sets error when transaction creation fails', async () => {
      mockAddTransaction.mockRejectedValue(new Error('TX_FAILED'));

      const { result } = renderHook(() => useMusdConversion());

      await act(async () => {
        await result.current.startConversionFlow();
      });

      expect(result.current.error).toBe('Failed to start conversion');
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: expect.stringContaining('/confirm'),
        }),
      );
    });
  });

  describe('cancelConversion', () => {
    it('navigates back', () => {
      const { result } = renderHook(() => useMusdConversion());

      act(() => {
        result.current.cancelConversion();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('markEducationSeen', () => {
    it('dispatches setMusdConversionEducationSeen with true', () => {
      mockSetMusdConversionEducationSeen.mockReturnValue({
        type: 'SET_MUSD_EDUCATION_SEEN',
      });

      const { result } = renderHook(() => useMusdConversion());

      act(() => {
        result.current.markEducationSeen();
      });

      expect(mockSetMusdConversionEducationSeen).toHaveBeenCalledWith(true);
      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});
