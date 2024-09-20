import React from 'react';
import { useSelector } from 'react-redux';

import { PrimaryType } from '../../../../../../../../shared/constants/signatures';
import { parseTypedDataMessage } from '../../../../../../../../shared/modules/transaction.utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import { Box } from '../../../../../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../../../helpers/constants/design-system';
import { SignatureRequestType } from '../../../../../types/confirm';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import PermitSimulationValueDisplay from './value-display/value-display';

function extractTokenDetailsByPrimaryType(
  message: Record<string, unknown>,
  primaryType: PrimaryType,
): object[] | unknown {
  let tokenDetails;

  switch (primaryType) {
    case PrimaryType.PermitBatch:
    case PrimaryType.PermitSingle:
      tokenDetails = message?.details;
      break;
    case PrimaryType.PermitBatchTransferFrom:
    case PrimaryType.PermitTransferFrom:
      tokenDetails = message?.permitted;
      break;
    default:
      break;
  }

  const isNonArrayObject = tokenDetails && !Array.isArray(tokenDetails);

  return isNonArrayObject ? [tokenDetails] : tokenDetails;
}

const PermitSimulation: React.FC<object> = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  const msgData = currentConfirmation.msgParams?.data;
  const {
    domain: { verifyingContract },
    message,
    primaryType,
  } = parseTypedDataMessage(msgData as string);

  const tokenDetails = extractTokenDetailsByPrimaryType(message, primaryType);

  return (
    <ConfirmInfoSection data-testid="confirmation__simulation_section">
      <ConfirmInfoRow
        label={t('simulationDetailsTitle')}
        tooltip={t('simulationDetailsTitleTooltip')}
      >
        <ConfirmInfoRowText text={t('permitSimulationDetailInfo')} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('spendingCap')}>
        <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
          {Array.isArray(tokenDetails) ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {tokenDetails.map(
                (
                  { token, amount }: { token: string; amount: string },
                  i: number,
                ) => (
                  <PermitSimulationValueDisplay
                    key={`${token}-${i}`}
                    primaryType={primaryType}
                    tokenContract={token}
                    value={amount}
                  />
                ),
              )}
            </Box>
          ) : (
            <PermitSimulationValueDisplay
              tokenContract={verifyingContract}
              value={message.value}
            />
          )}
        </Box>
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export default PermitSimulation;
