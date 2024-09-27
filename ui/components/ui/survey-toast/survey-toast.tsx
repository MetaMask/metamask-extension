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
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import { ACCOUNTS_API_BASE_URL } from '../../../../shared/constants/accounts';
import { setLastViewedUserSurvey } from '../../../store/actions';
import { Toast } from '../../multichain';

type Survey = {
  url: string;
  description: string;
  cta: string;
  id: number;
};

export function SurveyToast() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const lastViewedUserSurvey = useSelector(getLastViewedUserSurvey);
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const basicFunctionality = useSelector(getUseExternalServices);
  const internalAccount = useSelector(getSelectedInternalAccount);
  const metaMetricsId = useSelector(getMetaMetricsId);

  const surveyUrl = useMemo(
    () => `${ACCOUNTS_API_BASE_URL}/v1/users/${metaMetricsId}/surveys`,
    [metaMetricsId],
  );

  useEffect(() => {
    if (!basicFunctionality || !metaMetricsId) {
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

        const _survey: Survey = response?.surveys;

        if (!_survey || _survey.id <= lastViewedUserSurvey) {
          return;
        }

        setSurvey(_survey);
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('Failed to fetch survey:', error);
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
    metaMetricsId,
    dispatch,
  ]);

  function handleActionClick() {
    if (!survey) {
      return;
    }
    global.platform.openTab({
      url: survey.url,
    });
    dispatch(setLastViewedUserSurvey(survey.id));
    trackAction('accept');
  }

  function handleClose() {
    if (!survey) {
      return;
    }
    dispatch(setLastViewedUserSurvey(survey.id));
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
        survey: survey.id,
      },
    });
  }

  if (!survey || survey.id <= lastViewedUserSurvey) {
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
