/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { Platform } from '@metamask/profile-sync-controller/sdk';

import {
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getSlides,
  getUseExternalServices,
  getShowDownloadMobileAppSlide,
} from '../../selectors';
import { updateSlides } from '../../store/actions';
import type { CarouselSlide } from '../../../shared/constants/app-state';
import { useCarouselManagement } from './useCarouselManagement';
import { fetchCarouselSlidesFromContentful } from './fetchCarouselSlidesFromContentful';

jest.mock('./fetchCarouselSlidesFromContentful');
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn((selector) => selector()),
}));
jest.mock('../../store/actions', () => ({
  updateSlides: jest.fn(),
  getUserProfileLineage: jest.fn().mockResolvedValue({
    lineage: [{ agent: Platform.EXTENSION }],
  }),
}));

const mockFetch = jest.mocked(fetchCarouselSlidesFromContentful);
const mockUpdateSlides = jest.mocked(updateSlides);
const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);

const slide = (
  variableName: string,
  overrides: Partial<CarouselSlide> = {},
): CarouselSlide => ({
  id: `ctf_${variableName}`,
  title: variableName,
  description: `${variableName}_desc`,
  image: `/${variableName}.svg`,
  variableName,
  ...overrides,
});

const ZERO_BALANCE = '0x0';

// selector stubs
const mockGetSlides = jest.fn();
const mockGetSelectedAccountCachedBalance = jest.fn();
const mockGetUseExternalServices = jest.fn();
const mockGetSelectedInternalAccount = jest
  .fn()
  .mockReturnValue({ address: '0xabc' });
const mockGetShowDownloadMobileAppSlide = jest.fn().mockReturnValue(true);
const mockGetRemoteFeatureFlags = jest.fn();

describe('useCarouselManagement (simple Contentful tests)', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      prioritySlides: [],
      regularSlides: [slide('fund'), slide('downloadMobileApp')],
    });

    mockUseDispatch.mockReturnValue(jest.fn());
    mockUseSelector.mockImplementation(
      <TSelected>(selector: (state: unknown) => TSelected): TSelected => {
        if (selector === getSlides) {
          return mockGetSlides() as TSelected;
        }
        if (selector === getSelectedAccountCachedBalance) {
          return mockGetSelectedAccountCachedBalance() as TSelected;
        }
        if (selector === getSelectedInternalAccount) {
          return mockGetSelectedInternalAccount() as TSelected;
        }
        if (selector === getUseExternalServices) {
          return mockGetUseExternalServices() as TSelected;
        }
        if (selector === getShowDownloadMobileAppSlide) {
          return mockGetShowDownloadMobileAppSlide() as TSelected;
        }
        return undefined as unknown as TSelected;
      },
    );

    // defaults
    mockGetSlides.mockReturnValue([]);
    mockGetSelectedAccountCachedBalance.mockReturnValue(ZERO_BALANCE);
    mockGetUseExternalServices.mockReturnValue(false);
    mockGetRemoteFeatureFlags.mockReturnValue({
      contentfulCarouselEnabled: true,
    });

    jest.clearAllMocks();
  });

  const getDispatchedSlides = (): CarouselSlide[] => {
    expect(mockUpdateSlides).toHaveBeenCalled();
    return mockUpdateSlides.mock.calls[0][0];
  };

  test('zero balance, fund first and undismissable', async () => {
    renderHook(() => useCarouselManagement());
    await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());

    const updated = getDispatchedSlides();
    expect(updated.map((s) => s.variableName)).toEqual([
      'fund',
      'downloadMobileApp',
    ]);

    const fund = updated.find((s) => s.variableName === 'fund');
    expect(fund?.undismissable).toBe(true);
  });

  test('contentful disabled, empty array', async () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      contentfulCarouselEnabled: false,
    });

    renderHook(() => useCarouselManagement());
    await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());

    expect(getDispatchedSlides()).toEqual([]);
  });
});
