import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';

const TipsBank = () => {
  const t = useI18nContext();

  return (
    <div className="tips-bank-content">
      <div className="tips-bank-ico">
        <img src="./images/home/tips.svg" width={20} height={20} />
        <div>{t('tipsBank')}</div>
      </div>
      <div className="tips-bank-des">
        <div className="tips-bank-start">{t('startNow')}</div>
      </div>
    </div>
  );
};

export default TipsBank;
