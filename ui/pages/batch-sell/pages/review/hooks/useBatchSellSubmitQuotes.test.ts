import { renderHook, act } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { captureException } from '../../../../../../shared/lib/sentry';
import { submitBatchSellTrade } from '../../../../../ducks/bridge-status/actions';
import {
  getFromAccount,
  getIsStxEnabled,
} from '../../../../../ducks/bridge/selectors';
import type { ReceivedAsset } from '../types';
import { mockUseSelectorPassthrough } from '../../../../../../test/data/batch-sell';
import useBatchSellSubmitQuotes from './useBatchSellSubmitQuotes';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

jest.mock('../../../../../ducks/bridge-status/actions', () => ({
  submitBatchSellTrade: jest.fn(() => ({ type: 'SUBMIT_BATCH_SELL_TRADE' })),
}));

jest.mock('../../../../../ducks/bridge/selectors', () => ({
  getFromAccount: jest.fn(),
  getIsStxEnabled: jest.fn(),
}));

jest.mock('../../../../../helpers/constants/routes', () => ({
  DEFAULT_ROUTE: '/home',
}));

const mockDispatch = jest.fn();
const mockUseDispatch = jest.mocked(useDispatch);
const mockUseSelector = jest.mocked(useSelector);
const mockGetFromAccount = jest.mocked(getFromAccount);
const mockGetIsStxEnabled = jest.mocked(getIsStxEnabled);
const mockCaptureException = jest.mocked(captureException);
const mockSubmitBatchSellTrade = jest.mocked(submitBatchSellTrade);

const MOCK_ACCOUNT = { address: '0xdeadbeef', type: 'eip155:eoa' };

const MOCK_QUOTE_RESPONSE = { quote: { requestId: 'req-1' } } as never;

const MOCK_RECEIVED_ASSET_NO_SECURITY: ReceivedAsset = {
  id: 'eip155:1/erc20:0xusdc' as never,
  symbol: 'USDC',
  securityData: undefined,
};

const MOCK_RECEIVED_ASSET_WITH_SECURITY: ReceivedAsset = {
  id: 'eip155:1/erc20:0xusdc' as never,
  symbol: 'USDC',
  securityData: { type: 'VERIFIED' } as never,
};

function renderDefault(
  overrides: {
    quoteResponses?: (typeof MOCK_QUOTE_RESPONSE | null)[];
    receivedAsset?: ReceivedAsset;
  } = {},
) {
  const {
    quoteResponses = [MOCK_QUOTE_RESPONSE],
    receivedAsset = MOCK_RECEIVED_ASSET_NO_SECURITY,
  } = overrides;
  return renderHook(() =>
    useBatchSellSubmitQuotes({ quoteResponses, receivedAsset }),
  );
}

describe('useBatchSellSubmitQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch.mockResolvedValue(undefined);
    mockUseDispatch.mockReturnValue(mockDispatch as never);

    mockGetFromAccount.mockReturnValue(MOCK_ACCOUNT as never);
    mockGetIsStxEnabled.mockReturnValue(true as never);

    mockUseSelectorPassthrough(mockUseSelector);
  });

  describe('initial state', () => {
    it('returns isSubmitting as false', () => {
      const { result } = renderDefault();

      expect(result.current.isSubmitting).toBe(false);
    });

    it('exposes a submitBatchSellQuotes function', () => {
      const { result } = renderDefault();

      expect(typeof result.current.submitBatchSellQuotes).toBe('function');
    });
  });

  describe('submitBatchSellQuotes — early return when no account', () => {
    it('does not dispatch or navigate when fromAccount is null', async () => {
      mockGetFromAccount.mockReturnValue(null as never);

      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('leaves isSubmitting as false when fromAccount is null', async () => {
      mockGetFromAccount.mockReturnValue(null as never);

      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('submitBatchSellQuotes — successful submission', () => {
    it('dispatches submitBatchSellTrade with the correct arguments', async () => {
      const { result } = renderDefault({
        quoteResponses: [MOCK_QUOTE_RESPONSE],
        receivedAsset: MOCK_RECEIVED_ASSET_NO_SECURITY,
      });

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockSubmitBatchSellTrade).toHaveBeenCalledWith({
        quoteResponses: [MOCK_QUOTE_RESPONSE],
        accountAddress: MOCK_ACCOUNT.address,
        isStxEnabled: true,
        tokenSecurityTypeDestination: null,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SUBMIT_BATCH_SELL_TRADE',
      });
    });

    it('passes the security type from receivedAsset when present', async () => {
      const { result } = renderDefault({
        receivedAsset: MOCK_RECEIVED_ASSET_WITH_SECURITY,
      });

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockSubmitBatchSellTrade).toHaveBeenCalledWith(
        expect.objectContaining({ tokenSecurityTypeDestination: 'VERIFIED' }),
      );
    });

    it('passes null for tokenSecurityTypeDestination when securityData is undefined', async () => {
      const { result } = renderDefault({
        receivedAsset: MOCK_RECEIVED_ASSET_NO_SECURITY,
      });

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockSubmitBatchSellTrade).toHaveBeenCalledWith(
        expect.objectContaining({ tokenSecurityTypeDestination: null }),
      );
    });

    it('passes the smartTransactionsEnabled flag to the action', async () => {
      mockGetIsStxEnabled.mockReturnValue(false as never);

      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockSubmitBatchSellTrade).toHaveBeenCalledWith(
        expect.objectContaining({ isStxEnabled: false }),
      );
    });

    it('navigates to the activity tab after submission', async () => {
      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/home?tab=activity', {
        state: { stayOnHomePage: true },
        replace: true,
      });
    });

    it('resets isSubmitting to false after successful submission', async () => {
      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('submitBatchSellQuotes — error handling', () => {
    it('calls captureException when dispatch throws', async () => {
      const error = new Error('submission failed');
      mockDispatch.mockRejectedValue(error);

      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    it('resets isSubmitting to false even when dispatch throws', async () => {
      mockDispatch.mockRejectedValue(new Error('fail'));

      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('still navigates to the activity tab even when dispatch throws', async () => {
      mockDispatch.mockRejectedValue(new Error('fail'));

      const { result } = renderDefault();

      await act(async () => {
        await result.current.submitBatchSellQuotes();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/home?tab=activity', {
        state: { stayOnHomePage: true },
        replace: true,
      });
    });
  });
});
