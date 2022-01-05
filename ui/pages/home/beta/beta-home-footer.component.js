import React from 'react';
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import { useI18nContext } from '../../../hooks/useI18nContext';

const BetaHomeFooter = () => {
  const t = useI18nContext();

  return (
    <>
      <a href={SUPPORT_REQUEST_LINK} target="_blank" rel="noopener noreferrer">
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
