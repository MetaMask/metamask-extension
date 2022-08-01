import React from 'react';
import PropTypes from 'prop-types';

import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';

const FlaskHomeFooter = ({ trackEvent }) => {
  const t = useI18nContext();

  return (
    <>
      <a
        onClick={() => {
          trackEvent({
            category: EVENT.CATEGORIES.FOOTER,
            event: EVENT_NAMES.SUPPORT_LINK_CLICKED,
            properties: {
              action: 'Flask Home Footer',
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
        href="https://community.metamask.io/c/metamask-flask"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('needHelpFeedback')}
      </a>
    </>
  );
};

export default FlaskHomeFooter;

FlaskHomeFooter.propTypes = {
  trackEvent: PropTypes.func.isRequired,
};
