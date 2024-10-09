import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
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
import { SPENDING_CAP_UNLIMITED_MSG } from '../../../../../constants';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import StaticSimulation from '../../shared/static-simulation/static-simulation';
import { Container } from '../../shared/transaction-data/transaction-data';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';
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

  const decimals = initialDecimals || '0';

  const { spendingCap, formattedSpendingCap, value, pending } =
    useApproveTokenSimulation(transactionMeta, decimals);

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
      {spendingCap === SPENDING_CAP_UNLIMITED_MSG
        ? t('unlimited')
        : spendingCap}
    </Text>
  );

  const SpendingCapRow = (
    <ConfirmInfoRow
      label={t(isNFT ? 'simulationApproveHeading' : 'spendingCap')}
    >
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <Box
            display={Display.Inline}
            marginInlineEnd={1}
            minWidth={BlockSize.Zero}
          >
            {spendingCap === SPENDING_CAP_UNLIMITED_MSG ? (
              <Tooltip title={formattedSpendingCap}>
                {formattedTokenText}
              </Tooltip>
            ) : (
              formattedTokenText
            )}
          </Box>
          <Name
            value={transactionMeta.txParams.to as string}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
          />
        </Box>
      </Box>
    </ConfirmInfoRow>
  );

  const simulationElements = SpendingCapRow;

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t(
        isNFT
          ? 'simulationDetailsApproveDesc'
          : 'simulationDetailsERC20ApproveDesc',
      )}
      simulationElements={simulationElements}
    />
  );
};
