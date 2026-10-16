import { act } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { openWindow } from '../../../../helpers/utils/window';
import { getCustomerServiceToken } from '../../../../store/actions';
import {
  getSavedSupportDataSharingPreference,
  useOpenSupport,
} from './use-support-consent';

jest.mock('../../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  getCustomerServiceToken: jest.fn(),
}));

const stateWithPreferences = (
  shouldShowSupportConsent: boolean | undefined,
  supportDataSharingPreference: boolean | null | undefined,
) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      shouldShowSupportConsent,
      supportDataSharingPreference,
    },
  },
});

describe('getSavedSupportDataSharingPreference', () => {
  const select = (
    shouldShowSupportConsent: boolean | undefined,
    supportDataSharingPreference: boolean | null | undefined,
  ) =>
    getSavedSupportDataSharingPreference({
      metamask: {
        preferences: { shouldShowSupportConsent, supportDataSharingPreference },
      },
    });

  it('returns null while the consent modal should be shown', () => {
    expect(select(true, true)).toBeNull();
    expect(select(true, null)).toBeNull();
    expect(select(undefined, true)).toBeNull();
  });

  it('returns null when remembering is on but no choice was saved', () => {
    expect(select(false, null)).toBeNull();
    expect(select(false, undefined)).toBeNull();
  });

  it('returns the saved choice when remembering is on', () => {
    expect(select(false, true)).toBe(true);
    expect(select(false, false)).toBe(false);
  });
});

describe('useOpenSupport', () => {
  const mockShowConsentModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getCustomerServiceToken).mockResolvedValue('test-token');
  });

  const renderOpenSupport = (
    shouldShowSupportConsent: boolean,
    supportDataSharingPreference: boolean | null,
  ) =>
    renderHookWithProvider(
      () => useOpenSupport(mockShowConsentModal),
      stateWithPreferences(
        shouldShowSupportConsent,
        supportDataSharingPreference,
      ),
    ).result;

  it('shows the consent modal when no choice is saved', async () => {
    const result = renderOpenSupport(true, null);

    await act(() => result.current());

    expect(mockShowConsentModal).toHaveBeenCalledTimes(1);
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('opens support with the user data when the saved choice is to share', async () => {
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(getCustomerServiceToken).toHaveBeenCalledTimes(1);
    expect(openWindow).toHaveBeenCalledWith(
      expect.stringContaining('customer_service_token=test-token'),
    );
  });

  it('opens support without user data when the saved choice is not to share', async () => {
    const result = renderOpenSupport(false, false);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(getCustomerServiceToken).not.toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalledWith(SUPPORT_LINK);
  });
});
