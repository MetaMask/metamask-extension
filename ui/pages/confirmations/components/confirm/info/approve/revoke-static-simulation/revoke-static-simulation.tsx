import { NameType } from '@metamask/name-controller';

import React from 'react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import Name from '../../../../../../../components/app/name';
import { Box } from '../../../../../../../components/component-library';
import { Display } from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useTransactionMetadataRequest } from '../../../../../hooks/useTransactionMetadataRequest';
import StaticSimulation from '../../shared/static-simulation/static-simulation';
import { useTokenTransactionData } from '../../hooks/useTokenTransactionData';

export const RevokeStaticSimulation = () => {
  const t = useI18nContext();

  const transactionMeta = useTransactionMetadataRequest();

  const parsedTransactionData = useTokenTransactionData();

  const { chainId } = transactionMeta;

  const spender =
    parsedTransactionData?.args?._spender ??
    parsedTransactionData?.args?.spender ??
    '';

  const TokenContractRow = (
    <ConfirmInfoRow label={t('spendingCap')}>
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex}>
          <Name
            value={transactionMeta.txParams.to as string}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
            variation={chainId}
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
            value={spender}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
            variation={chainId}
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
