import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import { SURVEY_DATE, SURVEY_GMT } from '../../../helpers/constants/survey';
import mockState from '../../../../test/data/mock-state.json';
import {
  selectNewSrpAdded,
  selectShowPrivacyPolicyToast,
  selectShowSurveyToast,
  selectShowCopyAddressToast,
  selectShowInfuraSwitchToast,
} from './selectors';

const createMockSurveyState = (surveyLinkLastClickedOrClosed?: number) => ({
  metamask: {
    ...mockState.metamask,
    surveyLinkLastClickedOrClosed,
  },
});

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

const createMockAppState = (
  showNewSrpAddedToast?: number | false,
  showCopyAddressToast?: boolean,
) => ({
  appState: {
    ...mockState.appState,
    showNewSrpAddedToast,
    showCopyAddressToast,
  },
});

describe('#getShowSurveyToast', () => {
  const realDateNow = Date.now;

  afterEach(() => {
    Date.now = realDateNow;
  });

  it('shows the survey link when not yet seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(undefined);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(true);
  });

  it('does not show the survey link when seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(123456789);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link before time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 11:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(undefined);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link after time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 14:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(undefined);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(false);
  });
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

describe('#getShowNewSrpAddedToast', () => {
  it('returns the wallet number when set', () => {
    const mockStateData = createMockAppState(2);
    const result = selectNewSrpAdded(mockStateData);
    expect(result).toBe(2);
  });

  it('returns false when not set', () => {
    const mockStateData = createMockAppState(false);
    const result = selectNewSrpAdded(mockStateData);
    expect(result).toBe(false);
  });
});

describe('#selectShowCopyAddressToast', () => {
  it('returns true when showCopyAddressToast is true', () => {
    const mockStateData = createMockAppState(undefined, true);
    const result = selectShowCopyAddressToast(mockStateData);
    expect(result).toBe(true);
  });

  it('returns false when showCopyAddressToast is false', () => {
    const mockStateData = createMockAppState(undefined, false);
    const result = selectShowCopyAddressToast(mockStateData);
    expect(result).toBe(false);
  });

  it('returns false when showCopyAddressToast is undefined', () => {
    const mockStateData = createMockAppState();
    const result = selectShowCopyAddressToast(mockStateData);
    expect(result).toBe(false);
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
