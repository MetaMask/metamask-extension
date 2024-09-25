import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import Name from '../../../../../../../components/app/name';
import { Box } from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import StaticSimulation from '../../shared/static-simulation/static-simulation';

export const RevokeSetApprovalForAllStaticSimulation = ({
  spender,
}: {
  spender: string;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const nftsRow = (
    <ConfirmInfoRow label={t('nfts')}>
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <Name
            value={transactionMeta.txParams.to as string}
            type={NameType.ETHEREUM_ADDRESS}
          />
        </Box>
      </Box>
    </ConfirmInfoRow>
  );

  const permissionFromRow = (
    <ConfirmInfoRow label={t('permissionFrom')}>
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <Name value={spender} type={NameType.ETHEREUM_ADDRESS} />
        </Box>
      </Box>
    </ConfirmInfoRow>
  );

  const RevokeSetApprovalForAllRows = (
    <>
      {nftsRow}
      {permissionFromRow}
    </>
  );

  const simulationElements = RevokeSetApprovalForAllRows;

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('simulationDetailsRevokeSetApprovalForAllDesc')}
      simulationElements={simulationElements}
    />
  );
};
