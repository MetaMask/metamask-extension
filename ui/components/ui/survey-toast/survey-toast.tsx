import { useSelector, useDispatch } from 'react-redux';
import { Icon, IconName, IconSize, toast } from '@metamask/design-system-react';
import React, { useEffect, useState, useContext, useMemo } from 'react';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../../shared/constants/time';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  getLastViewedUserSurvey,
  getUseExternalServices,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { ACCOUNTS_API_BASE_URL } from '../../../../shared/constants/accounts';
import { setLastViewedUserSurvey } from '../../../store/actions';

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
  const { trackEvent } = useContext(MetaMetricsContext);
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
    if (!basicFunctionality || !metaMetricsId || !participateInMetaMetrics) {
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
          console.error('Failed to fetch survey:', metaMetricsId, error);
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
    participateInMetaMetrics,
    surveyUrl,
    dispatch,
  ]);

  useEffect(() => {
    if (!survey || survey.id <= lastViewedUserSurvey) {
      return undefined;
    }

    const trackAction = (response: 'accept' | 'deny') => {
      if (!participateInMetaMetrics) {
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
    };

    const handleActionClick = () => {
      global.platform.openTab({
        url: survey.url,
      });
      dispatch(setLastViewedUserSurvey(survey.id));
      trackAction('accept');
    };

    const handleClose = () => {
      dispatch(setLastViewedUserSurvey(survey.id));
      trackAction('deny');
    };

    toast({
      severity: 'default',
      'data-testid': 'survey-toast',
      title: survey.description,
      description: survey.content,
      actionButtonLabel: survey.cta,
      actionButtonOnClick: handleActionClick,
      onClose: handleClose,
      startAccessory: <Icon name={IconName.Feedback} size={IconSize.Lg} />,
    });

    return () => {
      toast.dismiss();
    };
  }, [
    dispatch,
    lastViewedUserSurvey,
    participateInMetaMetrics,
    survey,
    trackEvent,
  ]);

  return null;
}
