import React, { useEffect, useState, useContext } from 'react';
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
  const internalAccount = useSelector(getSelectedInternalAccount);

  useEffect(() => {
    const surveyId = 1;
    const surveyUrl = `https://accounts.dev-api.cx.metamask.io/v1/users/${internalAccount.address}/surveys?surveyId=${surveyId}`;

    const fetchSurvey = async () => {
      try {
        const response = await fetchWithCache({
          url: surveyUrl,
          fetchOptions: {
            method: 'GET',
            headers: {
              'x-metamask-clientproduct': 'metamask-extension',
            },
          },
          functionName: 'fetchSurveys',
          cacheOptions: { cacheRefreshTime: DAY * 7 },
        });
        console.log('survey res:', { response });

        const _survey: Survey = response?.surveys?.[0];

        if (
          response.surveys.length === 0 ||
          !_survey ||
          lastViewedUserSurvey <= _survey.surveyId
        ) {
          return;
        }

        setSurvey(_survey);
      } catch (error) {
        console.error('Failed to fetch survey:', error);
      }
    };

    fetchSurvey();
  }, [internalAccount.address, lastViewedUserSurvey, dispatch]);

  function handleActionClick() {
    if (!survey) {
      return;
    }
    window.open(survey.url, '_blank');
    dispatch(setLastViewedUserSurvey(survey.surveyId));

    trackEvent({
      event: MetaMetricsEventName.SurveyToast,
      category: MetaMetricsEventCategory.Feedback,
      properties: {
        response: 'accept',
        survey: survey.surveyId,
      },
    });
  }

  function handleClose() {
    if (!survey) {
      return;
    }
    dispatch(setLastViewedUserSurvey(survey.surveyId));

    trackEvent({
      event: MetaMetricsEventName.SurveyToast,
      category: MetaMetricsEventCategory.Feedback,
      properties: {
        response: 'deny',
        survey: survey.surveyId,
      },
    });
  }

  if (!survey) {
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
      startAdornment={undefined}
    />
  );
}
