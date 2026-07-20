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
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
  const internalAccount = useSelector(getSelectedInternalAccount);
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
          cacheOptions: { cacheRefreshTime: process.env.IN_TEST ? 0 : DAY },
        });

        const _survey: Survey = response?.surveys;

        if (
          !_survey ||
          Object.keys(_survey).length === 0 ||
          _survey.id <= lastViewedUserSurvey
        ) {
          return;
        }

        setSurvey(_survey);
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch survey:', analyticsId, error);
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
    analyticsId,
    isMetaMetricsEnabled,
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
