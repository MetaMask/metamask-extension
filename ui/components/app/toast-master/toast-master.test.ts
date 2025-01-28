import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import { SURVEY_DATE, SURVEY_GMT } from '../../../helpers/constants/survey';
import {
  selectShowPrivacyPolicyToast,
  selectShowSurveyToast,
} from './selectors';

describe('#getShowSurveyToast', () => {
  const realDateNow = Date.now;

  afterEach(() => {
    Date.now = realDateNow;
  });

  it('shows the survey link when not yet seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const result = selectShowSurveyToast({
      // @ts-expect-error: intentionally passing incomplete input
      metamask: {
        surveyLinkLastClickedOrClosed: undefined,
      },
    });
    expect(result).toStrictEqual(true);
  });

  it('does not show the survey link when seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const result = selectShowSurveyToast({
      // @ts-expect-error: intentionally passing incomplete input
      metamask: {
        surveyLinkLastClickedOrClosed: 123456789,
      },
    });
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link before time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 11:25:00 ${SURVEY_GMT}`).getTime();
    const result = selectShowSurveyToast({
      // @ts-expect-error: intentionally passing incomplete input
      metamask: {
        surveyLinkLastClickedOrClosed: undefined,
      },
    });
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link after time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 14:25:00 ${SURVEY_GMT}`).getTime();
    const result = selectShowSurveyToast({
      // @ts-expect-error: intentionally passing incomplete input
      metamask: {
        surveyLinkLastClickedOrClosed: undefined,
      },
    });
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
      const result = selectShowPrivacyPolicyToast({
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: false,
          onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        },
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });

    it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: true,
          onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        },
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: false,
          onboardingDate: undefined,
        },
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
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: false,
          onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        },
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });

    it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: true,
          onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        },
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: false,
          onboardingDate: undefined,
        },
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
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: false,
          onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        },
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('does not show the privacy policy toast before the policy date even if onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        // @ts-expect-error: intentionally passing incomplete input
        metamask: {
          newPrivacyPolicyToastClickedOrClosed: false,
          onboardingDate: undefined,
        },
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });
  });
});
