import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { hexToText } from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';
import { SignatureRequestType } from '../../../types/confirm';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';

const SignatureMessage: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  if (!currentConfirmation?.msgParams?.data) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label={t('message')}>
        <ConfirmInfoRowText
          text={hexToText(currentConfirmation.msgParams?.data)}
        />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
});

export default SignatureMessage;
