import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Typography from '../../../components/ui/typography/typography';
import { TEXT_ALIGN } from '../../../helpers/constants/design-system';

const WelcomeFooter = () => {
  const t = useI18nContext();

  return (
    <>
      <div className="welcome-page__header">{t('welcome')}</div>
      <Typography align={TEXT_ALIGN.CENTER} marginBottom={6}>
        {t('metamaskDescription')}
      </Typography>

      <Typography align={TEXT_ALIGN.CENTER}>{t('happyToSeeYou')}</Typography>
    </>
  );
};

export default WelcomeFooter;
