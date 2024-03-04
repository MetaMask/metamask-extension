import React from 'react';
import { useSelector } from 'react-redux';

import {
  ConfirmInfoRow,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../selectors';

const PersonalSignInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

  if (!currentConfirmation?.msgParams?.origin) {
    return null;
  }

  return (
    <ConfirmInfoRow label={t('requestFrom')} tooltip={t('requestFromInfo')}>
      <ConfirmInfoRowUrl url={currentConfirmation?.msgParams?.origin} />
    </ConfirmInfoRow>
  );
};

export default PersonalSignInfo;
