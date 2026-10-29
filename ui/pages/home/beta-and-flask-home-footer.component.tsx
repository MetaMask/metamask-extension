import React from 'react';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../helpers/constants/common';
import { isFlask } from '../../../shared/lib/build-types';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useSegmentContext } from '../../hooks/useSegmentContext';

export default function BetaAndFlaskHomeFooter() {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const segmentContext = useSegmentContext();

  return (
    <>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={SUPPORT_LINK}
        onClick={() => {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
              .addCategory(MetaMetricsEventCategory.Footer)
              .addProperties({
                url: SUPPORT_LINK,
                [MetaMetricsContextProp.PageTitle]: segmentContext.page?.title,
              })
              .build(),
          );
        }}
      >
        {t('needHelpSubmitTicket')}
      </a>
      {isFlask() && (
        <>
          {' | '}
          <a
            href="https://community.metamask.io/c/developer-discussion/11"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('needHelpFeedback')}
          </a>
        </>
      )}
    </>
  );
}
