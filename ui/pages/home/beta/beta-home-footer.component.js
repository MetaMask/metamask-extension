import React from 'react';
import PropTypes from 'prop-types';

import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';

const BetaHomeFooter = ({ trackEvent }) => {
  const t = useI18nContext();

  return (
    <>
      <a
        onClick={() => {
          trackEvent({
            category: EVENT.CATEGORIES.FOOTER,
            event: EVENT_NAMES.SUPPORT_LINK_CLICKED,
            properties: {
              action: 'Beta Home Footer',
              url: SUPPORT_REQUEST_LINK,
            },
          });
          global.platform.openTab({
            url: SUPPORT_REQUEST_LINK,
          });
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('needHelpSubmitTicket')}
      </a>{' '}
      |{' '}
      <a
        href="https://community.metamask.io/c/metamask-beta"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('needHelpFeedback')}
      </a>
    </>
  );
};

export default BetaHomeFooter;

BetaHomeFooter.propTypes = {
  trackEvent: PropTypes.func.isRequired,
};
