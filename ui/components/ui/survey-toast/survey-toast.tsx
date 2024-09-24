import { useSelector, useDispatch } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { Toast } from '../../multichain';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  getSelectedInternalAccount,
  getLastViewedUserSurvey,
} from '../../../selectors';
import { setLastViewedUserSurvey } from '../../../store/actions';
import { DAY } from '../../../../shared/constants/time';

type Survey = {
  url: string;
  description: string;
  cta: string;
  surveyId: number;
};

export function SurveyToast() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const dispatch = useDispatch();
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

  if (!survey) {
    return null;
  }

  function handleActionClick() {
    if (!survey) {
      return;
    }
    window.open(survey.url, '_blank');
    dispatch(setLastViewedUserSurvey(survey.surveyId));
  }

  function handleClose() {
    if (!survey) {
      return;
    }
    dispatch(setLastViewedUserSurvey(survey.surveyId));
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
