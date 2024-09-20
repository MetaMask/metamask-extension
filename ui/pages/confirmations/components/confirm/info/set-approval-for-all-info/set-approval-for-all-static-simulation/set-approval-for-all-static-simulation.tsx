import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import Name from '../../../../../../../components/app/name';
import { Box, Text } from '../../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  TextAlign,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import StaticSimulation from '../../shared/static-simulation/static-simulation';

export const SetApprovalForAllStaticSimulation = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>() as {
      currentConfirmation: TransactionMeta;
    };

  const SetApprovalForAllRow = (
    <ConfirmInfoRow label={t('withdrawing')}>
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <Box
            display={Display.Inline}
            marginInlineEnd={1}
            minWidth={BlockSize.Zero}
          >
            <Text
              data-testid="simulation-token-value"
              backgroundColor={BackgroundColor.backgroundAlternative}
              borderRadius={BorderRadius.XL}
              paddingInline={2}
              textAlign={TextAlign.Center}
              alignItems={AlignItems.center}
            >
              {t('all')}
            </Text>
          </Box>
          <Name
            value={transactionMeta.txParams.to as string}
            type={NameType.ETHEREUM_ADDRESS}
          />
        </Box>
      </Box>
    </ConfirmInfoRow>
  );

  const simulationElements = SetApprovalForAllRow;

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('simulationDetailsSetApprovalForAllDesc')}
      simulationElements={simulationElements}
    />
  );
};
