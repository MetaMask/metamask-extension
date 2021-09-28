import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const WelcomeFooter = () => {
  const t = useI18nContext();

  return (
    <>
      <div className="welcome-page__header">{t('welcomeToMetaMask')}</div>
      <div className="welcome-page__description">
        <p>{t('welcomeToMetaMaskIntro')}</p>
      </div>
    </>
  );
};

export default WelcomeFooter;
