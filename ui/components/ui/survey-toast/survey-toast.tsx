import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useToasterStore } from 'react-hot-toast';
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
import { toast } from '../toast/toast';

type Survey = {
  url: string;
  description: string;
  content?: string;
  cta: string;
  id: number;
};

const SURVEY_TOAST_ID = 'survey-toast';

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
  const isProgrammaticDismissRef = useRef(false);
  const { toasts } = useToasterStore();

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
    surveyUrl,
  ]);

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

  const handleActionClick = useCallback(() => {
    if (!survey) {
      return;
    }
    global.platform.openTab({
      url: survey.url,
    });
    dispatch(setLastViewedUserSurvey(survey.id));
    trackAction('accept');
  }, [dispatch, survey, trackAction]);

  const handleClose = useCallback(() => {
    if (!survey) {
      return;
    }
    dispatch(setLastViewedUserSurvey(survey.id));
    trackAction('deny');
  }, [dispatch, survey, trackAction]);

  const shouldShowSurvey = Boolean(survey && survey.id > lastViewedUserSurvey);

  useEffect(() => {
    if (!shouldShowSurvey || !survey) {
      isProgrammaticDismissRef.current = true;
      toast.dismiss(SURVEY_TOAST_ID);
      return undefined;
    }

    toast.success(
      {
        title: survey.description,
        description: survey.content,
        actionText: survey.cta,
        onActionClick: handleActionClick,
        id: SURVEY_TOAST_ID,
      },
      {
        duration: Infinity,
      },
    );

    return () => {
      isProgrammaticDismissRef.current = true;
      toast.dismiss(SURVEY_TOAST_ID);
    };
  }, [handleActionClick, shouldShowSurvey, survey]);

  useEffect(() => {
    const surveyToastState = toasts.find((t) => t.id === SURVEY_TOAST_ID);
    if (
      surveyToastState?.dismissed &&
      !isProgrammaticDismissRef.current &&
      shouldShowSurvey
    ) {
      handleClose();
    }
    if (surveyToastState?.dismissed) {
      isProgrammaticDismissRef.current = false;
    }
  }, [handleClose, shouldShowSurvey, toasts]);

  return null;
}
