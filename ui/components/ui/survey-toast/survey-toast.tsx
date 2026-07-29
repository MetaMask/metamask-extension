import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../../shared/constants/time';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  getLastViewedUserSurvey,
  getUseExternalServices,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
} from '../../../selectors';
import { ACCOUNTS_API_BASE_URL } from '../../../../shared/constants/accounts';
import { setLastViewedUserSurvey } from '../../../store/actions';
import { Toast } from '../../multichain';
import { useDispatch } from '../../../store/hooks';

type Survey = {
  url: string;
  description: string;
  content?: string;
  cta: string;
  id: number;
};

export function SurveyToast() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const lastViewedUserSurvey = useSelector(getLastViewedUserSurvey);
  const isOptedIn = useSelector(getOptedIn);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const basicFunctionality = useSelector(getUseExternalServices);
  const analyticsId = useSelector(getAnalyticsId);
  const isMetaMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;

  const surveyUrl = useMemo(
    () => `${ACCOUNTS_API_BASE_URL}/v1/users/${analyticsId}/surveys`,
    [analyticsId],
  );

  useEffect(() => {
    if (!basicFunctionality || !analyticsId || !isMetaMetricsEnabled) {
      return undefined;
    }

    // Defer the fetch by one macrotask so that rapid dep transitions during
    // createRoot hydration collapse into a single network request.  The
    // cleanup cancels any pending timer, so only the last stable dep state
    // actually fires a request.
    const timeoutId = setTimeout(() => {
      fetchWithCache({
        url: surveyUrl,
        fetchOptions: {
          method: 'GET',
          headers: {
            'x-metamask-clientproduct': 'metamask-extension',
          },
        },
        functionName: 'fetchSurveys',
        cacheOptions: { cacheRefreshTime: process.env.IN_TEST ? 0 : DAY },
      })
        .then((response) => {
          const _survey: Survey = response?.surveys;

          if (
            !_survey ||
            Object.keys(_survey).length === 0 ||
            _survey.id <= lastViewedUserSurvey
          ) {
            return;
          }

          setSurvey(_survey);
        })
        .catch((error: unknown) => {
          console.error('Failed to fetch survey:', analyticsId, error);
        });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    lastViewedUserSurvey,
    basicFunctionality,
    analyticsId,
    isMetaMetricsEnabled,
    surveyUrl,
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
    if (!isMetaMetricsEnabled || !survey) {
      return;
    }

    trackEvent(
      createEventBuilder(MetaMetricsEventName.SurveyToast)
        .addCategory(MetaMetricsEventCategory.Feedback)
        .addProperties({
          response,
          survey: survey.id,
        })
        .build(),
    );
  }

  if (!survey || survey.id <= lastViewedUserSurvey) {
    return null;
  }

  return (
    <Toast
      dataTestId="survey-toast"
      key="survey-toast"
      text={survey.description}
      description={survey.content}
      actionText={survey.cta}
      onActionClick={handleActionClick}
      onClose={handleClose}
      startAdornment={<Icon name={IconName.Feedback} size={IconSize.Lg} />}
    />
  );
}
