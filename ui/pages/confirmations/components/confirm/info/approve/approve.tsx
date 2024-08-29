import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import Name from '../../../../../../components/app/name';
import {
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextField,
  TextFieldType,
} from '../../../../../../components/component-library';
import Tooltip from '../../../../../../components/ui/tooltip';
import { updateCurrentConfirmation } from '../../../../../../ducks/confirm/confirm';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
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

const EditSpendingCapModal = ({
  isOpenEditSpendingCapModal,
  setIsOpenEditSpendingCapModal,
  customSpendingCap,
  setCustomSpendingCap,
}: {
  isOpenEditSpendingCapModal: boolean;
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
  customSpendingCap: string;
  setCustomSpendingCap: (newValue: string) => void;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const { userBalance, tokenSymbol, decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

  const accountBalance = getAccountBalance(userBalance || '0', decimals || '0');

  const { formattedSpendingCap } = useApproveTokenSimulation(
    transactionMeta,
    decimals || '0',
  );

  const [customSpendingCapCandidate, setCustomSpendingCapCandidate] =
    useState('');

  const onCancelHandler = () => {
    setIsOpenEditSpendingCapModal(false);
    setCustomSpendingCapCandidate('');
    setCustomSpendingCap('');
  };

  function submitEditSpendingCap() {
    setIsOpenEditSpendingCapModal(false);
    setCustomSpendingCapCandidate('');
    setCustomSpendingCap(customSpendingCapCandidate);
  }

  return (
    <Modal
      isOpen={isOpenEditSpendingCapModal}
      onClose={() => setIsOpenEditSpendingCapModal(false)}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      className="edit-spending-cap-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          justifyContent={JustifyContent.center}
          childrenWrapperProps={{
            alignItems: AlignItems.center,
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
          }}
        >
          <Text variant={TextVariant.headingMd}>{t('editSpendingCap')}</Text>
        </ModalHeader>
        <ModalBody>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            paddingBottom={4}
          >
            {t('editSpendingCapDesc')}
          </Text>
          <TextField
            type={TextFieldType.Number}
            value={customSpendingCapCandidate}
            onChange={(event) =>
              setCustomSpendingCapCandidate(event.target.value)
            }
            placeholder={`${
              customSpendingCap === ''
                ? formattedSpendingCap
                : customSpendingCap
            } ${tokenSymbol}`}
            style={{ width: '100%' }}
          />
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            paddingTop={1}
          >
            {t('editSpendingCapAccountBalance', [accountBalance, tokenSymbol])}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={() => submitEditSpendingCap()}
          onCancel={() => onCancelHandler()}
          submitButtonProps={{ children: t('save') }}
        />
      </ModalContent>
    </Modal>
  );
};

const ApproveStaticSimulation = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

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
    <>
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
  setIsOpenEditSpendingCapModal,
  customSpendingCap,
}: {
  tokenSymbol: string;
  decimals: string;
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
  customSpendingCap: string;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { spendingCap, formattedSpendingCap, value } =
    useApproveTokenSimulation(transactionMeta, decimals);

  const SpendingCapElement = (
    <ConfirmInfoRowText
      text={
        spendingCap === UNLIMITED_MSG
          ? `${t('unlimited')} ${tokenSymbol}`
          : `${
              customSpendingCap === ''
                ? formattedSpendingCap
                : customSpendingCap
            } ${tokenSymbol}`
      }
      onEditClick={() => setIsOpenEditSpendingCapModal(true)}
      editIconClassName="edit-spending-cap-icon"
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
        {spendingCap === UNLIMITED_MSG ? (
          <Tooltip title={formattedSpendingCap}>{SpendingCapElement}</Tooltip>
        ) : (
          SpendingCapElement
        )}
      </ConfirmInfoRow>
    </>
  );
};

const getAccountBalance = (userBalance: string, decimals: string) =>
  new BigNumber(userBalance)
    .dividedBy(new BigNumber(10).pow(Number(decimals)))
    .toNumber();

const SpendingCap = ({
  setIsOpenEditSpendingCapModal,
  customSpendingCap,
}: {
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
  customSpendingCap: string;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { userBalance, tokenSymbol, decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

  const accountBalance = getAccountBalance(userBalance || '0', decimals || '0');

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
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        customSpendingCap={customSpendingCap}
      />
    </ConfirmInfoSection>
  );
};

const ApproveInfo = () => {
  const dispatch = useDispatch();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const { isNFT } = useIsNFT(transactionMeta);

  const [isOpenEditSpendingCapModal, setIsOpenEditSpendingCapModal] =
    useState(false);
  const [customSpendingCap, _setCustomSpendingCap] = useState('');

  const setCustomSpendingCap = (newValue: string) => {
    if (newValue === '') {
      delete transactionMeta.customTokenAmount;
      delete transactionMeta.finalApprovalAmount;
    } else {
      transactionMeta.customTokenAmount = newValue;
      transactionMeta.finalApprovalAmount = newValue;
    }

    _setCustomSpendingCap(newValue);
    dispatch(updateCurrentConfirmation(transactionMeta));
  };

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <ApproveStaticSimulation />
      <ApproveDetails />
      {!isNFT && (
        <SpendingCap
          setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
          customSpendingCap={customSpendingCap}
        />
      )}
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
      <EditSpendingCapModal
        isOpenEditSpendingCapModal={isOpenEditSpendingCapModal}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        customSpendingCap={customSpendingCap}
        setCustomSpendingCap={setCustomSpendingCap}
      />
    </>
  );
};

export default ApproveInfo;
