import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import mockState from '../../../../test/data/mock-state.json';
import {
  selectShowPrivacyPolicyToast,
  selectShowInfuraSwitchToast,
} from './selectors';

const createMockPrivacyPolicyState = (
  newPrivacyPolicyToastClickedOrClosed?: boolean,
  onboardingDate?: number,
  newPrivacyPolicyToastShownDate?: number | null,
) => ({
  metamask: {
    ...mockState.metamask,
    newPrivacyPolicyToastClickedOrClosed,
    onboardingDate,
    newPrivacyPolicyToastShownDate,
  },
});

describe('#getShowPrivacyPolicyToast', () => {
  let dateNowSpy: jest.SpyInstance;

  describe('mock one day after', () => {
    beforeEach(() => {
      const dayAfterPolicyDate = new Date(PRIVACY_POLICY_DATE);
      dayAfterPolicyDate.setDate(dayAfterPolicyDate.getDate() + 1);

      dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(dayAfterPolicyDate.getTime());
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is before the policy date', () => {
      const mockStateData = createMockPrivacyPolicyState(
        false,
        new Date(PRIVACY_POLICY_DATE).setDate(
          new Date(PRIVACY_POLICY_DATE).getDate() - 2,
        ),
      );
      const result = selectShowPrivacyPolicyToast(mockStateData);
      expect(result.showPrivacyPolicyToast).toBe(true);
    });

    it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          true,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(false, undefined),
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });
  });

  describe('mock same day', () => {
    beforeEach(() => {
      dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(new Date(PRIVACY_POLICY_DATE).getTime());
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          false,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });

    it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          true,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(false, undefined),
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });
  });

  describe('mock day before', () => {
    beforeEach(() => {
      const dayBeforePolicyDate = new Date(PRIVACY_POLICY_DATE);
      dayBeforePolicyDate.setDate(dayBeforePolicyDate.getDate() - 1);

      dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(dayBeforePolicyDate.getTime());
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('does not show the privacy policy toast before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          false,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('does not show the privacy policy toast before the policy date even if onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(false, undefined),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });
  });
});

describe('#selectShowInfuraSwitchToast', () => {
  it('returns true when showInfuraSwitchToast is true', () => {
    const mockStateData = {
      appState: {
        showInfuraSwitchToast: true,
      },
    };
    const result = selectShowInfuraSwitchToast(mockStateData);
    expect(result).toBe(true);
  });

  it('returns false when showInfuraSwitchToast is false', () => {
    const mockStateData = {
      appState: {
        showInfuraSwitchToast: false,
      },
    };
    const result = selectShowInfuraSwitchToast(mockStateData);
    expect(result).toBe(false);
  });

  it('returns false when showInfuraSwitchToast is undefined', () => {
    const mockStateData = {
      appState: {},
    };
    const result = selectShowInfuraSwitchToast(mockStateData);
    expect(result).toBe(false);
  });
});
