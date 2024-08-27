import React from 'react';
import { useSelector } from 'react-redux';

import { Box } from '../../../../../../../components/component-library';
import { PrimaryType } from '../../../../../../../../shared/constants/signatures';
import { parseTypedDataMessage } from '../../../../../../../../shared/modules/transaction.utils';
import {
  Display,
  FlexDirection,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import { SignatureRequestType } from '../../../../../types/confirm';
import StaticSimulation from '../../shared/static-simulation/static-simulation';
import PermitSimulationValueDisplay from './value-display/value-display';

const PermitSimulation: React.FC<object> = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  const msgData = currentConfirmation.msgParams?.data;
  const {
    domain: { verifyingContract },
    message: { details, value },
    primaryType,
  } = parseTypedDataMessage(msgData as string);

  const isPermitSingle = primaryType === PrimaryType.PermitSingle;
  const isPermitBatch = primaryType === PrimaryType.PermitBatch;

  let tokenDetails;

  if (isPermitSingle) {
    tokenDetails = [details];
  } else if (isPermitBatch) {
    tokenDetails = details;
  }

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('permitSimulationDetailInfo')}
      simulationHeading={t('spendingCap')}
      simulationElements={
        tokenDetails ? (
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
                  tokenContract={token}
                  value={amount}
                />
              ),
            )}
          </Box>
        ) : (
          <PermitSimulationValueDisplay
            tokenContract={verifyingContract}
            value={value}
          />
        )
      }
    />
  );
};

export default PermitSimulation;
