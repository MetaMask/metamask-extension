import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../../shared/constants/time';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  getSelectedInternalAccount,
  getLastViewedUserSurvey,
  getUseExternalServices,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import { setLastViewedUserSurvey } from '../../../store/actions';
import { Toast } from '../../multichain';

type Survey = {
  url: string;
  description: string;
  cta: string;
  surveyId: number;
};

export function SurveyToast() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const lastViewedUserSurvey = useSelector(getLastViewedUserSurvey);
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const basicFunctionality = useSelector(getUseExternalServices);
  const internalAccount = useSelector(getSelectedInternalAccount);

  const surveyId = 1;
  const surveyUrl = useMemo(
    () =>
      `https://accounts.dev-api.cx.metamask.io/v1/users/0xe440f3bfca06198470e46cc32b7d108f607055f70a6f03ef8ee0fd423860cb47/surveys?surveyId=${surveyId}`,
    [internalAccount?.address],
  );

  useEffect(() => {
    if (!basicFunctionality || !internalAccount?.address) {
      return undefined;
    }

    const controller = new AbortController();

    const fetchSurvey = async () => {
      try {
        const response = await fetchWithCache({
          url: surveyUrl,
          fetchOptions: {
            method: 'GET',
            headers: {
              'x-metamask-clientproduct': 'metamask-extension',
            },
            signal: controller.signal,
          },
          functionName: 'fetchSurveys',
          cacheOptions: { cacheRefreshTime: DAY * 7 },
        });

        const _survey: Survey = response?.surveys?.[0];

        if (!_survey || _survey.surveyId <= lastViewedUserSurvey) {
          return;
        }

        setSurvey(_survey);
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch survey:', error);
        }
      }
    };

    fetchSurvey();

    return () => {
      controller.abort();
    };
  }, [
    internalAccount?.address,
    lastViewedUserSurvey,
    basicFunctionality,
    dispatch,
  ]);

  function handleActionClick() {
    if (!survey) {
      return;
    }
    global.platform.openTab({
      url: survey.url,
    });
    dispatch(setLastViewedUserSurvey(survey.surveyId));
    trackAction('accept');
  }

  function handleClose() {
    if (!survey) {
      return;
    }
    dispatch(setLastViewedUserSurvey(survey.surveyId));
    trackAction('deny');
  }

  function trackAction(response: 'accept' | 'deny') {
    if (!participateInMetaMetrics || !survey) {
      return;
    }

    trackEvent({
      event: MetaMetricsEventName.SurveyToast,
      category: MetaMetricsEventCategory.Feedback,
      properties: {
        response,
        survey: survey.surveyId,
      },
    });
  }

  if (!survey || survey.surveyId <= lastViewedUserSurvey) {
    return null;
  }

  return (
    <Toast
      dataTestId="survey-toast"
      key="survey-toast"
      text={survey.description}
      actionText={survey.cta}
      onActionClick={handleActionClick}
      onClose={handleClose}
      startAdornment={null}
    />
  );
}
