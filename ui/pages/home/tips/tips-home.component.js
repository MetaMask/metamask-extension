import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';

const TipsHome = () => {
  const t = useI18nContext();

  return (
    <div className="tips-home-content">
      <div className="tips-home-ico"></div>
      <div className="tips-home-des">{t('tipsHome')}</div>
    </div>
  );
};

export default TipsHome;
