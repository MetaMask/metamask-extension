import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import Name from '../../../../../../components/app/name';
import { Box, Text } from '../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  TextAlign,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import StaticSimulation from '../shared/static-simulation/static-simulation';
import { Container } from '../shared/transaction-data/transaction-data';
import { ApproveDetails } from './approve-details/approve-details';

const ApproveStaticSimulation = () => {
  const t = useI18nContext();

  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const decodedResponse = useDecodedTransactionData();

  const { value, pending } = decodedResponse;

  if (pending) {
    return <Container isLoading />;
  }

  if (!value) {
    return null;
  }

  const tokenId = `#${value.data[0].params[1].value}`;

  const simulationElements = (
    <>
      <Box display={Display.Flex}>
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
            {tokenId}
          </Text>
        </Box>
        <Name
          value={transactionMeta.txParams.to as string}
          type={NameType.ETHEREUM_ADDRESS}
        />
      </Box>
    </>
  );

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('simulationDetailsApproveDesc')}
      simulationHeading={t('simulationApproveHeading')}
      simulationElements={simulationElements}
    />
  );
};

const ApproveInfo = () => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <ApproveStaticSimulation />
      <ApproveDetails />
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
    </>
  );
};

export default ApproveInfo;
