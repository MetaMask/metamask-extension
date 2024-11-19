import React from 'react';
import { useSelector } from 'react-redux';

import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import {
  hexToText,
  sanitizeString,
} from '../../../../../../helpers/utils/util';
import { SignatureRequestType } from '../../../../types/confirm';
import { selectUseTransactionSimulations } from '../../../../selectors/preferences';
import { isSIWESignatureRequest } from '../../../../utils';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { SIWESignInfo } from './siwe-sign';

const PersonalSignInfo: React.FC = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const useTransactionSimulations = useSelector(
    selectUseTransactionSimulations,
  );

  if (!currentConfirmation?.msgParams) {
    return null;
  }

  const { from } = currentConfirmation.msgParams;
  const isSIWE = isSIWESignatureRequest(currentConfirmation);

  return (
    <>
      {isSIWE && useTransactionSimulations && (
        <ConfirmInfoSection>
          <ConfirmInfoRow
            label={t('simulationDetailsTitle')}
            tooltip={t('simulationDetailsTitleTooltip')}
          >
            <ConfirmInfoRowText text={t('siweSignatureSimulationDetailInfo')} />
          </ConfirmInfoRow>
        </ConfirmInfoSection>
      )}
      <ConfirmInfoSection>
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={isSIWE ? undefined : t('requestFromInfo')}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </ConfirmInfoAlertRow>
        {isSIWE && (
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.SigningInWith}
            label={t('signingInWith')}
            ownerId={currentConfirmation.id}
          >
            <ConfirmInfoRowAddress address={from} />
          </ConfirmInfoAlertRow>
        )}
      </ConfirmInfoSection>
      <ConfirmInfoSection>
        {isSIWE ? (
          <SIWESignInfo />
        ) : (
          <ConfirmInfoAlertRow
            alertKey="message"
            ownerId={currentConfirmation.id}
            label={t('message')}
          >
            <ConfirmInfoRowText
              text={sanitizeString(
                hexToText(currentConfirmation.msgParams?.data),
              )}
            />
          </ConfirmInfoAlertRow>
        )}
      </ConfirmInfoSection>
    </>
  );
};

export default PersonalSignInfo;
