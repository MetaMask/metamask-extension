import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useEffect, useState } from 'react';
import Name from '../../../../../../../components/app/name';
import { Box, Text } from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
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
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import StaticSimulation from '../../shared/static-simulation/static-simulation';
import { Container } from '../../shared/transaction-data/transaction-data';
import {
  UNLIMITED_MSG,
  useApproveTokenSimulation,
} from '../hooks/use-approve-token-simulation';
import { useIsNFT } from '../hooks/use-is-nft';

export const ApproveStaticSimulation = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const { decimals: initialDecimals } = useAssetDetails(
    transactionMeta?.txParams?.to,
    transactionMeta?.txParams?.from,
    transactionMeta?.txParams?.data,
  );

  // decimals are sometimes undefined for a split second, so we need to ensure
  // the spending cap is recalculated when the value updates
  const [decimals, setDecimals] = useState(initialDecimals || '0');

  useEffect(() => {
    if (initialDecimals && initialDecimals !== decimals) {
      setDecimals(initialDecimals);
    }
  }, [initialDecimals, decimals]);

  const { spendingCap, formattedSpendingCap, value, pending } =
    useApproveTokenSimulation(transactionMeta, decimals || '0');

  const { isNFT } = useIsNFT(transactionMeta);

  if (pending) {
    return <Container isLoading />;
  }

  if (!value) {
    return null;
  }

  const formattedTokenText = (
    <Text
      data-testid="simulation-token-value"
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.XL}
      paddingInline={2}
      textAlign={TextAlign.Center}
      alignItems={AlignItems.center}
    >
      {spendingCap === UNLIMITED_MSG ? t('unlimited') : spendingCap}
    </Text>
  );

  const simulationElements = (
    <Box display={Display.Flex}>
      <Box
        display={Display.Inline}
        marginInlineEnd={1}
        minWidth={BlockSize.Zero}
      >
        {spendingCap === UNLIMITED_MSG ? (
          <Tooltip title={formattedSpendingCap}>{formattedTokenText}</Tooltip>
        ) : (
          formattedTokenText
        )}
      </Box>
      <Name
        value={transactionMeta.txParams.to as string}
        type={NameType.ETHEREUM_ADDRESS}
      />
    </Box>
  );

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('simulationDetailsApproveDesc')}
      simulationHeading={
        isNFT ? t('simulationApproveHeading') : t('spendingCap')
      }
      simulationElements={simulationElements}
    />
  );
};
