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
import { isSIWESignatureRequest } from '../../../../utils';
import { AlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';

const PersonalSignInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  if (!currentConfirmation?.msgParams) {
    return null;
  }

  const { from } = currentConfirmation.msgParams;
  const isSiweSigReq = isSIWESignatureRequest(currentConfirmation);

  return (
    <>
      {isSiweSigReq && (
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
        <AlertRow
          alertKey="requestFrom"
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={t('requestFromInfo')}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </AlertRow>
        {isSiweSigReq && (
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
      </Box>
    </>
  );
};

export default PersonalSignInfo;
