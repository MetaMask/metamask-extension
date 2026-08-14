import React, { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { ACCOUNTS_API_BASE_URL } from '../../../../shared/constants/accounts';
import { setLastViewedUserSurvey } from '../../../store/actions';
import { ToastContent, type ToastWithClose, toast } from '../toast/toast';
import { useDispatch } from '../../../store/hooks';

type Survey = {
  url: string;
  description: string;
  content?: string;
  cta: string;
  id: number;
};

const toastId = 'survey-toast';
const surveyQueryKey = 'survey-toast';

export function SurveyToast() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const lastViewedUserSurvey = useSelector(getLastViewedUserSurvey);
  const isOptedIn = useSelector(getOptedIn);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const basicFunctionality = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const analyticsId = useSelector(getAnalyticsId);
  const isMetaMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;

  const surveyUrl = `${ACCOUNTS_API_BASE_URL}/v1/users/${analyticsId}/surveys`;

  const canFetchSurvey =
    isUnlocked &&
    basicFunctionality &&
    Boolean(analyticsId) &&
    isMetaMetricsEnabled;

  const { data } = useQuery<Survey | null>({
    queryKey: [surveyQueryKey, analyticsId],
    enabled: canFetchSurvey,
    staleTime: process.env.IN_TEST ? 0 : DAY,
    queryFn: async ({ signal }) => {
      try {
        const response = await fetchWithCache({
          url: surveyUrl,
          fetchOptions: {
            method: 'GET',
            headers: {
              'x-metamask-clientproduct': 'metamask-extension',
            },
            signal,
          },
          functionName: 'fetchSurveys',
          cacheOptions: { cacheRefreshTime: process.env.IN_TEST ? 0 : DAY },
        });

        const _survey = response?.surveys as Survey;

        if (
          !_survey ||
          Object.keys(_survey).length === 0 ||
          _survey.id <= lastViewedUserSurvey
        ) {
          return null;
        }

        return _survey;
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch survey:', analyticsId, error);
        }
        throw error;
      }
    },
  });

  const survey = canFetchSurvey ? data : undefined;

  const trackAction = useCallback(
    (response: 'accept' | 'deny') => {
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
    },
    [createEventBuilder, isMetaMetricsEnabled, survey, trackEvent],
  );

  const dismissSurvey = useCallback(
    (response: 'accept' | 'deny') => {
      if (!survey) {
        return;
      }

      dispatch(setLastViewedUserSurvey(survey.id));
      queryClient.invalidateQueries({
        queryKey: [surveyQueryKey, analyticsId],
      });
      trackAction(response);
      toast.dismiss(toastId);
    },
    [analyticsId, dispatch, queryClient, survey, trackAction],
  );

  const handleActionClick = useCallback(() => {
    if (!survey) {
      return;
    }

    global.platform.openTab({
      url: survey.url,
    });
    dismissSurvey('accept');
  }, [dismissSurvey, survey]);

  useEffect(() => {
    if (!survey || survey.id <= lastViewedUserSurvey) {
      toast.dismiss(toastId);
      return;
    }

    toast.success(
      <ToastContent
        dataTestId={toastId}
        title={survey.description}
        description={survey.content}
        actionText={survey.cta}
        onActionClick={handleActionClick}
      />,
      {
        id: toastId,
        duration: Infinity,
        icon: (
          <Icon
            className="self-start"
            name={IconName.Feedback}
            size={IconSize.Lg}
          />
        ),
        onClose: () => dismissSurvey('deny'),
      } as ToastWithClose,
    );
  }, [dismissSurvey, handleActionClick, lastViewedUserSurvey, survey]);

  useEffect(() => {
    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  return null;
}
