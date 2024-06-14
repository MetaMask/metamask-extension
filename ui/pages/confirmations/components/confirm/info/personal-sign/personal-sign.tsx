import React from 'react';
import { useSelector } from 'react-redux';

import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { Box } from '../../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../../helpers/constants/design-system';
import {
  hexToText,
  sanitizeString,
} from '../../../../../../helpers/utils/util';
import { SignatureRequestType } from '../../../../types/confirm';
import { selectUseTransactionSimulations } from '../../../../selectors/preferences';
import { isSIWESignatureRequest } from '../../../../utils';
import { AlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { SIWESignInfo } from './siwe-sign';

const PersonalSignInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;
  const useTransactionSimulations = useSelector(
    selectUseTransactionSimulations,
  );

  if (!currentConfirmation?.msgParams) {
    return null;
  }

  const {
    msgParams: { from },
  } = currentConfirmation;
  const isSIWE = isSIWESignatureRequest(currentConfirmation);

  return (
    <>
      {isSIWE && useTransactionSimulations && (
        <Box
          backgroundColor={BackgroundColor.backgroundDefault}
          borderRadius={BorderRadius.MD}
          padding={2}
          marginBottom={4}
        >
          <ConfirmInfoRow
            label={t('simulationDetailsTitle')}
            tooltip={t('simulationDetailsTitleTooltip')}
          >
            <ConfirmInfoRowText text={t('siweSignatureSimulationDetailInfo')} />
          </ConfirmInfoRow>
        </Box>
      )}
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        padding={2}
        marginBottom={4}
      >
        {/* isSIWEDomainValid: {{ isSIWEDomainValid }} */}
        <AlertRow
          alertKey="requestFrom"
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={t('requestFromInfo')}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </AlertRow>
        {isSIWE && (
          <ConfirmInfoRow label={t('signingInWith')}>
            <ConfirmInfoRowAddress address={from} />
          </ConfirmInfoRow>
        )}
      </Box>
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        padding={2}
        marginBottom={4}
      >
        {isSIWE ? (
          <SIWESignInfo />
        ) : (
          <AlertRow
            alertKey="message"
            ownerId={currentConfirmation.id}
            label={t('message')}
          >
            <ConfirmInfoRowText
              text={sanitizeString(
                hexToText(currentConfirmation.msgParams?.data),
              )}
            />
          </AlertRow>
        )}
      </Box>
    </>
  );
};

export default PersonalSignInfo;
