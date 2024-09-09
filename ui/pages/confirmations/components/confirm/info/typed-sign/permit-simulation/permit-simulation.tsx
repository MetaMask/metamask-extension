import React from 'react';

import { Box } from '../../../../../../../components/component-library';
import { PrimaryType } from '../../../../../../../../shared/constants/signatures';
import { parseTypedDataMessage } from '../../../../../../../../shared/modules/transaction.utils';
import {
  Display,
  FlexDirection,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../../../../types/confirm';
import { useConfirmContext } from '../../../../../context/confirm';
import StaticSimulation from '../../shared/static-simulation/static-simulation';
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
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const msgData = currentConfirmation.msgParams?.data;
  const {
    domain: { verifyingContract },
    message,
    primaryType,
  } = parseTypedDataMessage(msgData as string);

  const tokenDetails = extractTokenDetailsByPrimaryType(message, primaryType);

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('permitSimulationDetailInfo')}
      simulationHeading={t('spendingCap')}
      simulationElements={
        Array.isArray(tokenDetails) ? (
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
        )
      }
    />
  );
};

export default PermitSimulation;
