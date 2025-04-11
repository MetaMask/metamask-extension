import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { removeSlide, updateSlides } from '../../store/actions';
import { CarouselSlide } from '../../../shared/constants/app-state';
import {
  useCarouselManagement,
  getSweepstakesCampaignActive,
} from './useCarouselManagement';
import {
  FUND_SLIDE,
  BRIDGE_SLIDE,
  CARD_SLIDE,
  CASH_SLIDE,
  SWEEPSTAKES_SLIDE,
  SWEEPSTAKES_START,
  SWEEPSTAKES_END,
} from './constants';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  removeSlide: jest.fn((id) => ({ type: 'REMOVE_SLIDE', payload: id })),
  updateSlides: jest.fn((slides) => ({
    type: 'UPDATE_SLIDES',
    payload: slides,
  })),
}));

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUpdateSlides = updateSlides as jest.MockedFunction<
  typeof updateSlides
>;
const mockRemoveSlide = removeSlide as jest.MockedFunction<typeof removeSlide>;

describe('useCarouselManagement', () => {
  let mockDispatch: jest.Mock;
  let slides: CarouselSlide[];

  beforeEach(() => {
    delete process.env.IN_TEST;
    mockDispatch = jest.fn();
    mockUseDispatch.mockReturnValue(mockDispatch);

    slides = [];
    mockUseSelector.mockImplementation(() => slides);

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

  describe('hook behavior', () => {
    it('should build slides correctly when sweepstakes is not active', () => {
      const testDate = new Date(
        SWEEPSTAKES_START.getTime() - 86400000,
      ).toISOString(); // 1 day before

      renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: false,
          testDate,
        }),
      );

      expect(mockUpdateSlides).toHaveBeenCalled();

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      const fundSlide = updatedSlides.find(
        (slide: CarouselSlide) => slide.id === FUND_SLIDE.id,
      );
      expect(fundSlide).toBeDefined();
      expect(fundSlide?.undismissable).toBe(false);

      expect(
        updatedSlides.some(
          (slide: CarouselSlide) => slide.id === BRIDGE_SLIDE.id,
        ),
      ).toBe(true);
      expect(
        updatedSlides.some(
          (slide: CarouselSlide) => slide.id === CARD_SLIDE.id,
        ),
      ).toBe(true);
      expect(
        updatedSlides.some(
          (slide: CarouselSlide) => slide.id === CASH_SLIDE.id,
        ),
      ).toBe(true);

      const hasSweepstakesSlide = updatedSlides.some(
        (slide: CarouselSlide) => slide.id === SWEEPSTAKES_SLIDE.id,
      );
      expect(hasSweepstakesSlide).toBe(false);
    });

    it('should build slides correctly when sweepstakes is active', () => {
      const testDate = new Date(
        SWEEPSTAKES_START.getTime() + 1000,
      ).toISOString();

      renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: false,
          testDate,
        }),
      );

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      const sweepstakesSlide = updatedSlides.find(
        (slide: CarouselSlide) => slide.id === SWEEPSTAKES_SLIDE.id,
      );
      expect(sweepstakesSlide).toBeDefined();
      expect(sweepstakesSlide?.dismissed).toBe(false);

      expect(updatedSlides[0].id).toBe(SWEEPSTAKES_SLIDE.id);
      expect(updatedSlides[1].id).toBe(FUND_SLIDE.id);
    });

    it('should mark fund slide as undismissable when hasZeroBalance is true', () => {
      const testDate = new Date(
        SWEEPSTAKES_START.getTime() - 86400000,
      ).toISOString();

      renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: true,
          testDate,
        }),
      );

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      const fundSlide = updatedSlides.find(
        (slide: CarouselSlide) => slide.id === FUND_SLIDE.id,
      );
      expect(fundSlide).toBeDefined();
      expect(fundSlide?.undismissable).toBe(true);
    });

    it('should remove sweepstakes slide if it exists and sweepstakes is not active', () => {
      slides = [{ ...SWEEPSTAKES_SLIDE }];
      const testDate = new Date(
        SWEEPSTAKES_END.getTime() + 86400000,
      ).toISOString();

      renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: false,
          testDate,
        }),
      );

      expect(mockRemoveSlide).toHaveBeenCalledWith(SWEEPSTAKES_SLIDE.id);
    });

    it('should update slides when hasZeroBalance changes', () => {
      const testDate = new Date().toISOString();
      const { rerender } = renderHook((props) => useCarouselManagement(props), {
        initialProps: { hasZeroBalance: false, testDate },
      });

      mockUpdateSlides.mockClear();

      rerender({ hasZeroBalance: true, testDate });

      expect(mockUpdateSlides).toHaveBeenCalled();

      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      const fundSlide = updatedSlides.find(
        (slide: CarouselSlide) => slide.id === FUND_SLIDE.id,
      );
      expect(fundSlide).toBeDefined();
      expect(fundSlide?.undismissable).toBe(true);
    });

    it('should update slides when testDate changes', () => {
      const initialTestDate = new Date(
        SWEEPSTAKES_START.getTime() - 86400000,
      ).toISOString();

      const { rerender } = renderHook((props) => useCarouselManagement(props), {
        initialProps: { hasZeroBalance: false, testDate: initialTestDate },
      });

      const initialSlides = mockUpdateSlides.mock.calls[0][0];

      const initialHasSweepstakesSlide = initialSlides.some(
        (slide: CarouselSlide) => slide.id === SWEEPSTAKES_SLIDE.id,
      );
      expect(initialHasSweepstakesSlide).toBe(false);

      mockUpdateSlides.mockClear();

      const newTestDate = new Date(
        SWEEPSTAKES_START.getTime() + 1000,
      ).toISOString();
      rerender({ hasZeroBalance: false, testDate: newTestDate });

      const newSlides = mockUpdateSlides.mock.calls[0][0];

      const newHasSweepstakesSlide = newSlides.some(
        (slide: CarouselSlide) => slide.id === SWEEPSTAKES_SLIDE.id,
      );
      expect(newHasSweepstakesSlide).toBe(true);
    });
  });

  describe('return value', () => {
    it('should return the current slides', () => {
      const mockSlides: CarouselSlide[] = [
        {
          id: 'test-slide',
          title: 'Test Slide',
          description: 'Test Description',
          image: 'test-image',
        },
      ];
      slides = mockSlides;

      const { result } = renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: false,
        }),
      );

      expect(result.current.slides).toBe(mockSlides);
    });
  });

  describe('slide order', () => {
    it('should maintain correct order when slides are updated multiple times', () => {
      const testDate = new Date(
        SWEEPSTAKES_START.getTime() + 1000,
      ).toISOString();

      const { rerender } = renderHook((props) => useCarouselManagement(props), {
        initialProps: {
          hasZeroBalance: false,
          testDate,
        },
      });

      let updatedSlides = mockUpdateSlides.mock.calls[0][0] as CarouselSlide[];
      expect(updatedSlides[0].id).toBe(SWEEPSTAKES_SLIDE.id);
      expect(updatedSlides[1].id).toBe(FUND_SLIDE.id);
      expect(updatedSlides[1].undismissable).toBe(false);

      mockUpdateSlides.mockClear();
      mockDispatch.mockClear();

      rerender({
        hasZeroBalance: true,
        testDate,
      });

      expect(mockUpdateSlides).toHaveBeenCalled();
      updatedSlides = mockUpdateSlides.mock.calls[0][0] as CarouselSlide[];

      expect(updatedSlides[0].id).toBe(SWEEPSTAKES_SLIDE.id);
      expect(updatedSlides[1].id).toBe(FUND_SLIDE.id);
      const fundSlide = updatedSlides.find(
        (slide) => slide.id === FUND_SLIDE.id,
      );
      expect(fundSlide?.undismissable).toBe(true);
    });

    it('should handle empty slides array', () => {
      mockUseSelector.mockImplementation(() => []);
      const testDate = new Date(
        SWEEPSTAKES_START.getTime() + 1000,
      ).toISOString();

      renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: false,
          testDate,
        }),
      );

      const updatedSlides = mockUpdateSlides.mock
        .calls[0][0] as CarouselSlide[];
      expect(updatedSlides.length).toBeGreaterThan(0);
      expect(updatedSlides[0].id).toBe(SWEEPSTAKES_SLIDE.id);
    });

    it('should maintain all required slide properties', () => {
      const testDate = new Date(
        SWEEPSTAKES_START.getTime() + 1000,
      ).toISOString();

      renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: true,
          testDate,
        }),
      );

      const updatedSlides = mockUpdateSlides.mock
        .calls[0][0] as CarouselSlide[];

      const sweepstakesSlide = updatedSlides.find(
        (slide) => slide.id === SWEEPSTAKES_SLIDE.id,
      );
      expect(sweepstakesSlide).toEqual({
        ...SWEEPSTAKES_SLIDE,
        dismissed: false,
      });

      const fundSlide = updatedSlides.find(
        (slide) => slide.id === FUND_SLIDE.id,
      );
      expect(fundSlide).toEqual({
        ...FUND_SLIDE,
        undismissable: true,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle exactly at SWEEPSTAKES_START time', () => {
      const testDate = SWEEPSTAKES_START.toISOString();

      renderHook(() =>
        useCarouselManagement({
          hasZeroBalance: false,
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
          hasZeroBalance: false,
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
            hasZeroBalance: false,
            testDate,
          }),
        ),
      ).not.toThrow();

      expect(mockUpdateSlides).toHaveBeenCalled();
    });
  });
});
