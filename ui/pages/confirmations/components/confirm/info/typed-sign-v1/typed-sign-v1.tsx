import React from 'react';

import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import {
  ConfirmInfoRow,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  SignatureRequestType,
  TypedSignDataV1Type,
} from '../../../../types/confirm';
import { useConfirmContext } from '../../../../context/confirm';
import { ConfirmInfoRowTypedSignDataV1 } from '../../row/typed-sign-data-v1/typedSignDataV1';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';

const TypedSignV1Info: React.FC = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();

  if (!(currentConfirmation as SignatureRequestType)?.msgParams) {
    return null;
  }

  return (
    <>
      <ConfirmInfoSection>
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={t('requestFromInfo')}
        >
          <ConfirmInfoRowUrl
            url={currentConfirmation.msgParams?.origin ?? ''}
          />
        </ConfirmInfoAlertRow>
      </ConfirmInfoSection>
      <ConfirmInfoSection>
        <ConfirmInfoRow label={t('message')}>
          <ConfirmInfoRowTypedSignDataV1
            data={currentConfirmation.msgParams?.data as TypedSignDataV1Type}
          />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
};

export default TypedSignV1Info;
