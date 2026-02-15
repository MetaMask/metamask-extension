import React, { useContext } from 'react';

import { SUPPORT_LINK } from '../../helpers/constants/common';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';

export default function BetaAndFlaskHomeFooter() {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  return (
    <>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={SUPPORT_LINK}
        onClick={() => {
          trackEvent(
            {
              category: MetaMetricsEventCategory.Footer,
              event: MetaMetricsEventName.SupportLinkClicked,
              properties: {
                url: SUPPORT_LINK,
              },
            },
            {
              contextPropsIntoEventProperties: [
                MetaMetricsContextProp.PageTitle,
              ],
            },
          );
        }}
      >
        {t('needHelpSubmitTicket')}
      </a>
      {process.env.METAMASK_BUILD_TYPE === 'flask' && (
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
