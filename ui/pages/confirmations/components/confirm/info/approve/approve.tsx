import { NameType } from '@metamask/name-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import Name from '../../../../../../components/app/name';
import { Box, Text } from '../../../../../../components/component-library';
import Tooltip from '../../../../../../components/ui/tooltip';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  TextAlign,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { useConfirmContext } from '../../../../context/confirm';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import StaticSimulation from '../shared/static-simulation/static-simulation';
import { Container } from '../shared/transaction-data/transaction-data';
import { ApproveDetails } from './approve-details/approve-details';
import {
  UNLIMITED_MSG,
  useApproveTokenSimulation,
} from './hooks/use-approve-token-simulation';
import { useIsNFT } from './hooks/use-is-nft';

const ApproveStaticSimulation = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

  const { tokenAmount, formattedTokenNum, value, pending } =
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
      {tokenAmount === UNLIMITED_MSG ? t('unlimited') : tokenAmount}
    </Text>
  );

  const simulationElements = (
    <>
      <Box display={Display.Flex}>
        <Box
          display={Display.Inline}
          marginInlineEnd={1}
          minWidth={BlockSize.Zero}
        >
          {tokenAmount === UNLIMITED_MSG ? (
            <Tooltip title={formattedTokenNum}>{formattedTokenText}</Tooltip>
          ) : (
            formattedTokenText
          )}
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
      simulationHeading={
        isNFT ? t('simulationApproveHeading') : t('spendingCap')
      }
      simulationElements={simulationElements}
    />
  );
};

const SpendingCapGroup = ({
  tokenSymbol,
  decimals,
}: {
  tokenSymbol: string;
  decimals: string;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { tokenAmount, formattedTokenNum, value } = useApproveTokenSimulation(
    transactionMeta,
    decimals,
  );

  const SpendingCapElement = (
    <ConfirmInfoRowText
      text={
        tokenAmount === UNLIMITED_MSG
          ? `${t('unlimited')} ${tokenSymbol}`
          : `${formattedTokenNum} ${tokenSymbol}`
      }
      onEditClick={
        transactionMeta.type === TransactionType.tokenMethodIncreaseAllowance
          ? () => console.log('TODO on a following ticket')
          : undefined
      }
      editIconClassName="edit-spending-cap"
    />
  );

  if (!value) {
    return null;
  }

  return (
    <>
      <ConfirmInfoRowDivider />

      <ConfirmInfoRow
        label={t('spendingCap')}
        tooltip={t('spendingCapTooltipDesc')}
      >
        {tokenAmount === UNLIMITED_MSG ? (
          <Tooltip title={formattedTokenNum}>{SpendingCapElement}</Tooltip>
        ) : (
          SpendingCapElement
        )}
      </ConfirmInfoRow>
    </>
  );
};

const SpendingCap = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { userBalance, tokenSymbol, decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

  const accountBalance = new BigNumber(userBalance || '0')
    .dividedBy(new BigNumber(10).pow(Number(decimals || '0')))
    .toNumber();

  const { pending } = useApproveTokenSimulation(
    transactionMeta,
    decimals || '0',
  );

  if (pending) {
    return <Container isLoading />;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label={t('accountBalance')}>
        <ConfirmInfoRowText text={`${accountBalance} ${tokenSymbol || ''}`} />
      </ConfirmInfoRow>

      <SpendingCapGroup
        tokenSymbol={tokenSymbol || ''}
        decimals={decimals || '0'}
      />
    </ConfirmInfoSection>
  );
};

const ApproveInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const { isNFT } = useIsNFT(transactionMeta);

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <ApproveStaticSimulation />
      <ApproveDetails />
      {!isNFT && <SpendingCap />}
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
    </>
  );
};

export default ApproveInfo;
