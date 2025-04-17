import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { updateSlides } from '../../store/actions';
import { getSelectedAccountCachedBalance, getSlides } from '../../selectors';
import { getIsRemoteModeEnabled } from '../../selectors/remote-mode';
import { CarouselSlide } from '../../../shared/constants/app-state';
import {
  getSweepstakesCampaignActive,
  useCarouselManagement,
} from './useCarouselManagement';
import {
  FUND_SLIDE,
  BRIDGE_SLIDE,
  CARD_SLIDE,
  CASH_SLIDE,
  SWEEPSTAKES_SLIDE,
  SWEEPSTAKES_START,
  SWEEPSTAKES_END,
  ZERO_BALANCE,
  REMOTE_MODE_SLIDE,
  MULTI_SRP_SLIDE,
  SOLANA_SLIDE,
} from './constants';

const SLIDES_ZERO_FUNDS_REMOTE_OFF_SWEEPSTAKES_OFF = [
  { ...FUND_SLIDE, undismissable: true },
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_POSITIVE_FUNDS_REMOTE_OFF_SWEEPSTAKES_OFF = [
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  { ...FUND_SLIDE, undismissable: false },
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_ZERO_FUNDS_REMOTE_ON_SWEEPSTAKES_OFF = [
  REMOTE_MODE_SLIDE,
  { ...FUND_SLIDE, undismissable: true },
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_POSITIVE_FUNDS_REMOTE_ON_SWEEPSTAKES_OFF = [
  REMOTE_MODE_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  { ...FUND_SLIDE, undismissable: false },
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_ZERO_FUNDS_REMOTE_OFF_SWEEPSTAKES_ON = [
  { ...SWEEPSTAKES_SLIDE, dismissed: false },
  { ...FUND_SLIDE, undismissable: true },
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_POSITIVE_FUNDS_REMOTE_OFF_SWEEPSTAKES_ON = [
  { ...SWEEPSTAKES_SLIDE, dismissed: false },
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  { ...FUND_SLIDE, undismissable: false },
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_ZERO_FUNDS_REMOTE_ON_SWEEPSTAKES_ON = [
  { ...SWEEPSTAKES_SLIDE, dismissed: false },
  REMOTE_MODE_SLIDE,
  { ...FUND_SLIDE, undismissable: true },
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_POSITIVE_FUNDS_REMOTE_ON_SWEEPSTAKES_ON = [
  { ...SWEEPSTAKES_SLIDE, dismissed: false },
  REMOTE_MODE_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  { ...FUND_SLIDE, undismissable: false },
  CASH_SLIDE,
  MULTI_SRP_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../store/actions', () => ({
  updateSlides: jest.fn(),
}));

jest.mock('../../selectors/selectors.js', () => ({
  ...jest.requireActual('../../selectors/selectors.js'),
  getSelectedAccountCachedBalance: jest.fn(),
  getSlides: jest.fn(),
}));

jest.mock('../../selectors/remote-feature-flags', () => ({
  getIsRemoteModeEnabled: jest.fn(),
}));

const mockUpdateSlides = jest.mocked(updateSlides);
const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);

const mockGetSlides = jest.fn();
const mockGetSelectedAccountCachedBalance = jest.fn();
const mockGetIsRemoteModeEnabled = jest.fn();

describe('useCarouselManagement', () => {
  let validTestDate: string;
  let invalidTestDate: string;

  beforeEach(() => {
    delete process.env.IN_TEST;
    // Test dates
    validTestDate = new Date(SWEEPSTAKES_START.getTime() + 1000).toISOString(); // 1 day after
    invalidTestDate = new Date(
      SWEEPSTAKES_START.getTime() - 1000,
    ).toISOString(); // 1 day before
    // Mocks
    mockUseDispatch.mockReturnValue(jest.fn());
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getSlides) {
        return mockGetSlides();
      }
      if (selector === getSelectedAccountCachedBalance) {
        return mockGetSelectedAccountCachedBalance();
      }
      if (selector === getIsRemoteModeEnabled) {
        return mockGetIsRemoteModeEnabled();
      }
      return undefined;
    });
    // Default values
    mockGetSlides.mockReturnValue([]);
    mockGetSelectedAccountCachedBalance.mockReturnValue(ZERO_BALANCE);
    mockGetIsRemoteModeEnabled.mockReturnValue(false);
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.IN_TEST = 'true';
  });

  describe('getSweepstakesCampaignActive', () => {
    it('returns true when date is within the sweepstakes period', () => {
      const testDate = new Date(SWEEPSTAKES_START.getTime() + 1000); // 1 second after start
      expect(getSweepstakesCampaignActive(testDate)).toBe(true);
    });

    it('returns false when date is before the sweepstakes period', () => {
      const testDate = new Date(SWEEPSTAKES_START.getTime() - 1000); // 1 second before start
      expect(getSweepstakesCampaignActive(testDate)).toBe(false);
    });

    it('returns false when date is after the sweepstakes period', () => {
      const testDate = new Date(SWEEPSTAKES_END.getTime() + 1000); // 1 second after end
      expect(getSweepstakesCampaignActive(testDate)).toBe(false);
    });
  });

  describe('zero funds, remote off, sweepstakes off', () => {
    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: invalidTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_ZERO_FUNDS_REMOTE_OFF_SWEEPSTAKES_OFF,
      );
    });

    it('should mark fund slide as undismissable', () => {
      renderHook(() => useCarouselManagement({ testDate: invalidTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides[0].undismissable).toBe(true);
    });
  });

  describe('zero funds, remote on, sweepstakes off', () => {
    beforeEach(() => {
      mockGetIsRemoteModeEnabled.mockReturnValue(true);
    });

    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: invalidTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_ZERO_FUNDS_REMOTE_ON_SWEEPSTAKES_OFF,
      );
    });
  });

  describe('zero funds, remote off, sweepstakes on', () => {
    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: validTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_ZERO_FUNDS_REMOTE_OFF_SWEEPSTAKES_ON,
      );
    });
  });

  describe('zero funds, remote on, sweepstakes on', () => {
    beforeEach(() => {
      mockGetIsRemoteModeEnabled.mockReturnValue(true);
    });

    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: validTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_ZERO_FUNDS_REMOTE_ON_SWEEPSTAKES_ON,
      );
    });
  });

  describe('positive funds, remote off, sweepstakes off', () => {
    beforeEach(() => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');
    });

    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: invalidTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_POSITIVE_FUNDS_REMOTE_OFF_SWEEPSTAKES_OFF,
      );
    });
  });

  describe('positive funds, remote on, sweepstakes off', () => {
    beforeEach(() => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');
      mockGetIsRemoteModeEnabled.mockReturnValue(true);
    });

    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: invalidTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_POSITIVE_FUNDS_REMOTE_ON_SWEEPSTAKES_OFF,
      );
    });
  });

  describe('positive funds, remote off, sweepstakes on', () => {
    beforeEach(() => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');
    });

    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: validTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_POSITIVE_FUNDS_REMOTE_OFF_SWEEPSTAKES_ON,
      );
    });
  });

  describe('positive funds, remote on, sweepstakes on', () => {
    beforeEach(() => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');
      mockGetIsRemoteModeEnabled.mockReturnValue(true);
    });

    it('should have correct slide order', () => {
      renderHook(() => useCarouselManagement({ testDate: validTestDate }));

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_POSITIVE_FUNDS_REMOTE_ON_SWEEPSTAKES_ON,
      );
    });
  });

  describe('state changes', () => {
    it('should update slides when balance changes', () => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');

      const { rerender } = renderHook((props) => useCarouselManagement(props), {
        initialProps: { testDate: invalidTestDate },
      });

      expect(mockUpdateSlides).toHaveBeenCalled();
      let updatedSlides = mockUpdateSlides.mock.calls[0][0];
      expect(updatedSlides).toStrictEqual(
        SLIDES_POSITIVE_FUNDS_REMOTE_OFF_SWEEPSTAKES_OFF,
      );

      mockGetSelectedAccountCachedBalance.mockReturnValue(ZERO_BALANCE);
      mockUpdateSlides.mockClear();

      rerender({ testDate: invalidTestDate });

      expect(mockUpdateSlides).toHaveBeenCalled();

      updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_ZERO_FUNDS_REMOTE_OFF_SWEEPSTAKES_OFF,
      );
    });

    it('should update slides when testDate changes', () => {
      const { rerender } = renderHook((props) => useCarouselManagement(props), {
        initialProps: { hasZeroBalance: false, testDate: invalidTestDate },
      });

      expect(mockUpdateSlides).toHaveBeenCalled();
      let updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(
        SLIDES_ZERO_FUNDS_REMOTE_OFF_SWEEPSTAKES_OFF,
      );

      mockUpdateSlides.mockClear();

      rerender({ hasZeroBalance: false, testDate: validTestDate });

      expect(mockUpdateSlides).toHaveBeenCalled();
      updatedSlides = mockUpdateSlides.mock.calls[0][0];
      expect(updatedSlides).toStrictEqual(
        SLIDES_ZERO_FUNDS_REMOTE_OFF_SWEEPSTAKES_ON,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle exactly at SWEEPSTAKES_START time', () => {
      const testDate = SWEEPSTAKES_START.toISOString();

      renderHook(() =>
        useCarouselManagement({
          testDate,
        }),
      );

      const updatedSlides = mockUpdateSlides.mock
        .calls[0][0] as CarouselSlide[];
      expect(updatedSlides[0].id).toBe(SWEEPSTAKES_SLIDE.id);
    });

    it('should handle exactly at SWEEPSTAKES_END time', () => {
      const testDate = SWEEPSTAKES_END.toISOString();

      renderHook(() =>
        useCarouselManagement({
          testDate,
        }),
      );

      const updatedSlides = mockUpdateSlides.mock
        .calls[0][0] as CarouselSlide[];
      expect(updatedSlides[0].id).toBe(SWEEPSTAKES_SLIDE.id);
    });

    it('should handle invalid testDate gracefully', () => {
      const testDate = 'invalid-date';

      expect(() =>
        renderHook(() =>
          useCarouselManagement({
            testDate,
          }),
        ),
      ).not.toThrow();

      expect(mockUpdateSlides).toHaveBeenCalled();
    });
  });
});
