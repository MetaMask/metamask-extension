/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import { getUserProfileLineage, updateSlides } from '../../store/actions';
import {
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getSlides,
  getUseExternalServices,
  getShowDownloadMobileAppSlide,
} from '../../selectors';
import { CarouselSlide } from '../../../shared/constants/app-state';
import * as AccountUtils from '../../../shared/lib/multichain/accounts';
import { useCarouselManagement } from './useCarouselManagement';
import {
  FUND_SLIDE,
  CARD_SLIDE,
  ZERO_BALANCE,
  SOLANA_SLIDE,
  BASIC_FUNCTIONALITY_SLIDE,
  DOWNLOAD_MOBILE_APP_SLIDE,
} from './constants';
import { fetchCarouselSlidesFromContentful } from './fetchCarouselSlidesFromContentful';

jest.mock('./fetchCarouselSlidesFromContentful');
jest
  .mocked(fetchCarouselSlidesFromContentful)
  .mockResolvedValue({ prioritySlides: [], regularSlides: [] });

const SLIDES_ZERO_FUNDS_REMOTE_OFF = [
  { ...FUND_SLIDE, undismissable: true },
  CARD_SLIDE,
  BASIC_FUNCTIONALITY_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_ZERO_FUNDS_REMOTE_ON = [
  { ...FUND_SLIDE, undismissable: true },
  CARD_SLIDE,
  BASIC_FUNCTIONALITY_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_POSITIVE_FUNDS_REMOTE_OFF = [
  { ...FUND_SLIDE, undismissable: false },
  CARD_SLIDE,
  BASIC_FUNCTIONALITY_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const SLIDES_POSITIVE_FUNDS_REMOTE_ON = [
  { ...FUND_SLIDE, undismissable: false },
  CARD_SLIDE,
  BASIC_FUNCTIONALITY_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
];

const MOCK_ACCOUNT = {
  address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
  id: 'c3deeb99-ba0d-4a4e-a0aa-033fc1f79ae3',
  metadata: {
    importTime: 0,
    name: 'Snap Account 1',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      enabled: true,
      id: 'local:snap-id',
      name: 'snap-name',
    },
  },
  options: {},
  methods: [
    'personal_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  scopes: ['eip155:0'],
  type: 'eip155:eoa',
};

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../store/actions', () => ({
  updateSlides: jest.fn(),
  getUserProfileLineage: jest.fn().mockResolvedValue({
    lineage: [
      {
        agent: 'extension',
      },
    ],
  }),
}));

jest.mock('../../selectors/selectors.js', () => ({
  ...jest.requireActual('../../selectors/selectors.js'),
  getSelectedAccountCachedBalance: jest.fn(),
  getSlides: jest.fn(),
  getUseExternalServices: jest.fn(),
}));

const mockUpdateSlides = jest.mocked(updateSlides);
const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);

const mockGetSlides = jest.fn();
const mockGetSelectedAccountCachedBalance = jest.fn();
const mockGetUseExternalServices = jest.fn();
const mockGetSelectedInternalAccount = jest
  .fn()
  .mockImplementation(() => MOCK_ACCOUNT);
const mockGetShowDownloadMobileAppSlide = jest.fn().mockReturnValue(true);

describe('useCarouselManagement', () => {
  beforeEach(() => {
    delete process.env.IN_TEST;
    // Mocks
    mockUseDispatch.mockReturnValue(jest.fn());
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getSlides) {
        return mockGetSlides();
      }
      if (selector === getSelectedAccountCachedBalance) {
        return mockGetSelectedAccountCachedBalance();
      }
      if (selector === getSelectedInternalAccount) {
        return mockGetSelectedInternalAccount();
      }
      if (selector === getUseExternalServices) {
        return mockGetUseExternalServices();
      }
      if (selector === getShowDownloadMobileAppSlide) {
        return mockGetShowDownloadMobileAppSlide();
      }
      return undefined;
    });
    // Default values
    mockGetSlides.mockReturnValue([]);
    mockGetSelectedAccountCachedBalance.mockReturnValue(ZERO_BALANCE);
    mockGetUseExternalServices.mockReturnValue(false);
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.IN_TEST = 'true';
  });

  describe('zero funds, remote off', () => {
    it('should have correct slide order', async () => {
      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(SLIDES_ZERO_FUNDS_REMOTE_OFF);
    });

    it('should mark fund slide as undismissable', async () => {
      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides[0].undismissable).toBe(true);
    });

    it('should mark fund slide as undismissable when using the hex 0x00 for zero balance', async () => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x00');
      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides: CarouselSlide[] = mockUpdateSlides.mock.calls[0][0];

      const fundsSlide = updatedSlides.find((s) => s.id === FUND_SLIDE.id);
      expect(fundsSlide).toBeDefined();
      expect(fundsSlide?.undismissable).toBe(true);
    });
  });

  describe('zero funds, remote on', () => {
    it('should have correct slide order', async () => {
      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(SLIDES_ZERO_FUNDS_REMOTE_ON);
    });
  });

  describe('positive funds, remote off', () => {
    beforeEach(() => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');
    });

    it('should have correct slide order', async () => {
      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(SLIDES_POSITIVE_FUNDS_REMOTE_OFF);
    });
  });

  describe('positive funds, remote on', () => {
    beforeEach(() => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');
      mockGetUseExternalServices.mockReturnValue(false);
    });

    it('should have correct slide order', async () => {
      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(SLIDES_POSITIVE_FUNDS_REMOTE_ON);
    });
  });

  describe('positive funds, remote off', () => {
    beforeEach(() => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');
    });
  });

  describe('state changes', () => {
    it('should update slides when balance changes', async () => {
      mockGetSelectedAccountCachedBalance.mockReturnValue('0x1');

      const { rerender } = renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      let updatedSlides = mockUpdateSlides.mock.calls[0][0];
      expect(updatedSlides).toStrictEqual(SLIDES_POSITIVE_FUNDS_REMOTE_OFF);

      mockGetSelectedAccountCachedBalance.mockReturnValue(ZERO_BALANCE);
      mockUpdateSlides.mockClear();

      rerender();

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());

      updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(SLIDES_ZERO_FUNDS_REMOTE_OFF);
    });

    it('should update slides when testDate changes', async () => {
      const { rerender } = renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      let updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual(SLIDES_ZERO_FUNDS_REMOTE_OFF);

      mockUpdateSlides.mockClear();

      rerender({ hasZeroBalance: false });

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      updatedSlides = mockUpdateSlides.mock.calls[0][0];
      expect(updatedSlides).toStrictEqual(SLIDES_ZERO_FUNDS_REMOTE_OFF);
    });
  });

  describe('Smart account upgrade slide', () => {
    beforeEach(() => {
      mockGetUseExternalServices.mockReturnValue(false);
    });
    it('should not be displayed if solana address is selected', async () => {
      jest.spyOn(AccountUtils, 'isSolanaAddress').mockReturnValue(true);
      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual([
        { ...FUND_SLIDE, undismissable: true },
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        ///: END:ONLY_INCLUDE_IF
        CARD_SLIDE,
        BASIC_FUNCTIONALITY_SLIDE,
        SOLANA_SLIDE,
      ]);
    });
  });

  describe('Download mobile app slide', () => {
    it('should display if user is not available on mobile', async () => {
      mockGetUseExternalServices.mockReturnValue(true);

      jest.mocked(getUserProfileLineage).mockResolvedValue({
        lineage: [
          {
            agent: Platform.EXTENSION,
            metametrics_id: '0xdeadbeef',
            created_at: '2021-01-01',
            updated_at: '2021-01-01',
            counter: 1,
          },
        ],
        created_at: '2025-07-16T10:03:57Z',
        profile_id: '0deaba86-4b9d-4137-87d7-18bc5bf7708d',
      });

      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual([
        DOWNLOAD_MOBILE_APP_SLIDE,
        { ...FUND_SLIDE, undismissable: true },
        CARD_SLIDE,
        ///: BEGIN:ONLY_INCLUDE_IF(solana)
        SOLANA_SLIDE,
        ///: END:ONLY_INCLUDE_IF
      ]);
    });

    it('should not display if user is available on mobile', async () => {
      mockGetUseExternalServices.mockReturnValue(true);

      jest.mocked(getUserProfileLineage).mockResolvedValue({
        lineage: [
          {
            agent: Platform.MOBILE,
            metametrics_id: '0xdeadbeef',
            created_at: '2021-01-01',
            updated_at: '2021-01-01',
            counter: 1,
          },
        ],
        created_at: '2025-07-16T10:03:57Z',
        profile_id: '0deaba86-4b9d-4137-87d7-18bc5bf7708d',
      });

      renderHook(() => useCarouselManagement());

      await waitFor(() => expect(mockUpdateSlides).toHaveBeenCalled());
      const updatedSlides = mockUpdateSlides.mock.calls[0][0];

      expect(updatedSlides).toStrictEqual([
        { ...FUND_SLIDE, undismissable: true },
        CARD_SLIDE,
        ///: BEGIN:ONLY_INCLUDE_IF(solana)
        SOLANA_SLIDE,
        ///: END:ONLY_INCLUDE_IF
      ]);
    });
  });
});
