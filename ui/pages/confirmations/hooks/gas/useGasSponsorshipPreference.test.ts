import { renderHook, act } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { setGasSponsorshipOptOut } from '../../../../store/actions';
import { useGasSponsorshipPreference } from './useGasSponsorshipPreference';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../shared/lib/selectors/preferences');
jest.mock('../../../../store/actions');

const mockUseDispatch = jest.mocked(useDispatch);
const mockUseSelector = jest.mocked(useSelector);
const mockGetPreferences = jest.mocked(getPreferences);
const mockSetGasSponsorshipOptOut = jest.mocked(setGasSponsorshipOptOut);

describe('useGasSponsorshipPreference', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockGetPreferences.mockReturnValue({
      gasSponsorshipOptOutByChainId: {},
    } as ReturnType<typeof getPreferences>);
  });

  describe('isSponsorshipOptedOut', () => {
    it('returns false when chainId has no preference', () => {
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {},
      });

      const { result } = renderHook(() => useGasSponsorshipPreference('0x1'));

      expect(result.current.isSponsorshipOptedOut).toBe(false);
    });

    it('returns true when chainId is opted out', () => {
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {
          '0x1': true,
        },
      });

      const { result } = renderHook(() => useGasSponsorshipPreference('0x1'));

      expect(result.current.isSponsorshipOptedOut).toBe(true);
    });

    it('returns false when chainId is undefined', () => {
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {
          '0x1': true,
        },
      });

      const { result } = renderHook(() =>
        useGasSponsorshipPreference(undefined),
      );

      expect(result.current.isSponsorshipOptedOut).toBe(false);
    });

    it('returns false when chainId is opted in explicitly', () => {
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {
          '0x1': false,
        },
      });

      const { result } = renderHook(() => useGasSponsorshipPreference('0x1'));

      expect(result.current.isSponsorshipOptedOut).toBe(false);
    });
  });

  describe('setSponsorshipOptedOut', () => {
    it('dispatches setGasSponsorshipOptOut with correct merged state', () => {
      const mockAction = {
        type: 'SET_GAS_SPONSORSHIP_OPT_OUT',
      } as unknown as ReturnType<typeof setGasSponsorshipOptOut>;
      mockSetGasSponsorshipOptOut.mockReturnValue(mockAction);
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {
          '0x1': false,
          '0x89': true,
        },
      });

      const { result } = renderHook(() => useGasSponsorshipPreference('0x1'));

      act(() => {
        result.current.setSponsorshipOptedOut(true);
      });

      expect(mockSetGasSponsorshipOptOut).toHaveBeenCalledWith({
        '0x1': true,
        '0x89': true,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockAction);
    });

    it('does nothing when chainId is undefined', () => {
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {
          '0x1': true,
        },
      });

      const { result } = renderHook(() =>
        useGasSponsorshipPreference(undefined),
      );

      act(() => {
        result.current.setSponsorshipOptedOut(true);
      });

      expect(mockSetGasSponsorshipOptOut).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('sets opt-out to false when called with false', () => {
      const mockAction = {
        type: 'SET_GAS_SPONSORSHIP_OPT_OUT',
      } as unknown as ReturnType<typeof setGasSponsorshipOptOut>;
      mockSetGasSponsorshipOptOut.mockReturnValue(mockAction);
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {
          '0x1': true,
        },
      });

      const { result } = renderHook(() => useGasSponsorshipPreference('0x1'));

      act(() => {
        result.current.setSponsorshipOptedOut(false);
      });

      expect(mockSetGasSponsorshipOptOut).toHaveBeenCalledWith({
        '0x1': false,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockAction);
    });

    it('preserves other chain preferences when updating', () => {
      const mockAction = {
        type: 'SET_GAS_SPONSORSHIP_OPT_OUT',
      } as unknown as ReturnType<typeof setGasSponsorshipOptOut>;
      mockSetGasSponsorshipOptOut.mockReturnValue(mockAction);
      mockUseSelector.mockReturnValue({
        gasSponsorshipOptOutByChainId: {
          '0x1': false,
          '0x89': true,
          '0xa': false,
        },
      });

      const { result } = renderHook(() => useGasSponsorshipPreference('0x89'));

      act(() => {
        result.current.setSponsorshipOptedOut(false);
      });

      expect(mockSetGasSponsorshipOptOut).toHaveBeenCalledWith({
        '0x1': false,
        '0x89': false,
        '0xa': false,
      });
    });
  });
});
