import { NameType } from '@metamask/name-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
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
import { currentConfirmationSelector } from '../../../../../../selectors';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import StaticSimulation from '../shared/static-simulation/static-simulation';
import { Container } from '../shared/transaction-data/transaction-data';
import { ApproveDetails } from './approve-details/approve-details';
import { useApproveTokenSimulation } from './hooks/use-approve-token-simulation';
import { useIsNFT } from './hooks/use-is-nft';
import { useReceivedToken } from './hooks/use-received-token';

const ApproveStaticSimulation = () => {
  const t = useI18nContext();

  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const { tokenAmount, formattedTokenNum, value, pending } =
    useApproveTokenSimulation(transactionMeta);

  if (pending) {
    return <Container isLoading />;
  }

  if (!value) {
    return null;
  }

  const simulationElements = (
    <>
      <Box display={Display.Flex}>
        <Box
          display={Display.Inline}
          marginInlineEnd={1}
          minWidth={BlockSize.Zero}
        >
          {tokenAmount === t('unlimited') ? (
            <Tooltip title={formattedTokenNum}>
              <Text
                data-testid="simulation-token-value"
                backgroundColor={BackgroundColor.backgroundAlternative}
                borderRadius={BorderRadius.XL}
                paddingInline={2}
                textAlign={TextAlign.Center}
                alignItems={AlignItems.center}
              >
                {tokenAmount}
              </Text>
            </Tooltip>
          ) : (
            <Text
              data-testid="simulation-token-value"
              backgroundColor={BackgroundColor.backgroundAlternative}
              borderRadius={BorderRadius.XL}
              paddingInline={2}
              textAlign={TextAlign.Center}
              alignItems={AlignItems.center}
            >
              {formattedTokenNum}
            </Text>
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
      simulationHeading={t('simulationApproveHeading')}
      simulationElements={simulationElements}
    />
  );
};

const SpendingCap = () => {
  const t = useI18nContext();

  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const { receivedToken } = useReceivedToken();

  const { tokenAmount, formattedTokenNum, value, pending } =
    useApproveTokenSimulation(transactionMeta);

  if (pending) {
    return <Container isLoading />;
  }

  if (!receivedToken) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label={t('accountBalance')} tooltip={'Ask Barbara'}>
        <ConfirmInfoRowText
          text={`${receivedToken.string} ${receivedToken.symbol}`}
        />
      </ConfirmInfoRow>

      {value ? (
        <>
          <ConfirmInfoRowDivider />

          <ConfirmInfoRow label={t('spendingCap')} tooltip={'Ask Barbara'}>
            {tokenAmount === t('unlimited') ? (
              <Tooltip title={formattedTokenNum}>
                <ConfirmInfoRowText
                  text={`${tokenAmount} ${receivedToken.symbol}`}
                  onEditClick={
                    transactionMeta.type ===
                    TransactionType.tokenMethodIncreaseAllowance
                      ? () => console.log('TODO on a following ticket')
                      : undefined
                  }
                  editIconClassName="edit-spending-cap"
                />
              </Tooltip>
            ) : (
              <ConfirmInfoRowText
                text={`${formattedTokenNum} ${receivedToken.symbol}`}
                onEditClick={
                  transactionMeta.type ===
                  TransactionType.tokenMethodIncreaseAllowance
                    ? () => console.log('TODO on a following ticket')
                    : undefined
                }
                editIconClassName="edit-spending-cap"
              />
            )}
          </ConfirmInfoRow>
        </>
      ) : null}
    </ConfirmInfoSection>
  );
};

const ApproveInfo = () => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

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
