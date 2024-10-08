import { SURVEY_DATE, SURVEY_GMT } from '../../helpers/constants/survey';
import { getShowSurveyToast } from './toast-master';

describe('#getShowSurveyToast', () => {
  const realDateNow = Date.now;

  afterEach(() => {
    Date.now = realDateNow;
  });

  it('shows the survey link when not yet seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const result = getShowSurveyToast({
      metamask: {
        surveyLinkLastClickedOrClosed: null,
      },
    });
    expect(result).toStrictEqual(true);
  });

  it('does not show the survey link when seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const result = getShowSurveyToast({
      metamask: {
        surveyLinkLastClickedOrClosed: 123456789,
      },
    });
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link before time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 11:25:00 ${SURVEY_GMT}`).getTime();
    const result = getShowSurveyToast({
      metamask: {
        surveyLinkLastClickedOrClosed: null,
      },
    });
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link after time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 14:25:00 ${SURVEY_GMT}`).getTime();
    const result = getShowSurveyToast({
      metamask: {
        surveyLinkLastClickedOrClosed: null,
      },
    });
    expect(result).toStrictEqual(false);
  });
});
