import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import Name from '../../../../../../../components/app/name';
import { Box } from '../../../../../../../components/component-library';
import { Display } from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import StaticSimulation from '../../shared/static-simulation/static-simulation';

export const RevokeStaticSimulation = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const TokenContractRow = (
    <ConfirmInfoRow label={t('spendingCap')}>
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex}>
          <Name
            value={transactionMeta.txParams.to as string}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
          />
        </Box>
      </Box>
    </ConfirmInfoRow>
  );

  const SpenderRow = (
    <ConfirmInfoRow label={t('spender')}>
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex}>
          <Name
            value={transactionMeta.txParams.from as string}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
          />
        </Box>
      </Box>
    </ConfirmInfoRow>
  );

  const simulationElements = (
    <>
      {TokenContractRow}
      {SpenderRow}
    </>
  );

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('revokeSimulationDetailsDesc')}
      simulationElements={simulationElements}
    />
  );
};
