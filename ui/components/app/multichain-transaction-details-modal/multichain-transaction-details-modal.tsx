import React, { useContext } from 'react';
import { capitalize } from 'lodash';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@metamask/keyring-api';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  IconColor,
  FontWeight,
  TextColor,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
  Text,
  ModalFooter,
  Button,
  IconName,
  ButtonVariant,
  Icon,
  IconSize,
  ButtonSize,
  ButtonLink,
  ButtonLinkSize,
} from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventLinkType,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ConfirmInfoRowDivider as Divider } from '../confirm/info/row';
import { getURLHostName, shortenAddress } from '../../../helpers/utils/util';
import {
  KEYRING_TRANSACTION_STATUS_KEY,
  useMultichainTransactionDisplay,
} from '../../../hooks/useMultichainTransactionDisplay';
import { MultichainProviderConfig } from '../../../../shared/constants/multichain/networks';
import {
  formatTimestamp,
  getTransactionUrl,
  getAddressUrl,
  shortenTransactionId,
} from './helpers';

export type MultichainTransactionDetailsModalProps = {
  transaction: Transaction;
  onClose: () => void;
  userAddress: string;
  networkConfig: MultichainProviderConfig;
};

export function MultichainTransactionDetailsModal({
  transaction,
  onClose,
  userAddress,
  networkConfig,
}: MultichainTransactionDetailsModalProps) {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const { assetInputs, assetOutputs, isRedeposit, baseFee, priorityFee } =
    useMultichainTransactionDisplay(transaction, networkConfig);

  const getStatusColor = (txStatus: string) => {
    switch (txStatus.toLowerCase()) {
      case TransactionStatus.Confirmed:
        return TextColor.successDefault;
      case TransactionStatus.Unconfirmed:
        return TextColor.warningDefault;
      case TransactionStatus.Failed:
        return TextColor.errorDefault;
      default:
        return TextColor.textDefault;
    }
  };
  const statusKey = KEYRING_TRANSACTION_STATUS_KEY[transaction.status];

  const accountComponent = (title: string, address?: string) =>
    address ? (
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
          {title}
        </Text>
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
          <ButtonLink
            size={ButtonLinkSize.Inherit}
            textProps={{
              variant: TextVariant.bodyMd,
              alignItems: AlignItems.flexStart,
            }}
            as="a"
            externalLink
            href={getAddressUrl(address, transaction.chain)}
          >
            {shortenAddress(address)}
            <Icon
              marginLeft={2}
              name={IconName.Export}
              size={IconSize.Sm}
              color={IconColor.primaryDefault}
              onClick={() =>
                navigator.clipboard.writeText(
                  getAddressUrl(address as string, transaction.chain),
                )
              }
            />
          </ButtonLink>
        </Box>
      </Box>
    ) : null;

  const amountComponent = (
    {
      amount,
      unit,
    }: {
      amount: string;
      unit: string;
    },
    title: string,
    dataTestId: string,
  ) => (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
      <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
        {title}
      </Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
      >
        <Text variant={TextVariant.bodyMd} data-testid={dataTestId}>
          {amount} {unit}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Modal
      onClose={onClose}
      data-testid="multichain-transaction-details-modal"
      isOpen
      isClosedOnOutsideClick={true}
      isClosedOnEscapeKey={true}
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          padding: 4,
        }}
      >
        <ModalHeader onClose={onClose} padding={0}>
          <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
            {capitalize(isRedeposit ? t('redeposit') : transaction.type)}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
          >
            {formatTimestamp(transaction.timestamp)}
          </Text>
        </ModalHeader>

        <Box paddingBottom={4}>
          <Divider />
        </Box>
        <Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            {/* Status */}
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
                {t('status')}
              </Text>
              <Text
                variant={TextVariant.bodyMd}
                color={getStatusColor(transaction.status)}
              >
                {capitalize(t(statusKey))}
              </Text>
            </Box>

            {/* Transaction ID */}
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
                {t('notificationItemTransactionId')}
              </Text>
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={1}
              >
                <ButtonLink
                  size={ButtonLinkSize.Inherit}
                  textProps={{
                    variant: TextVariant.bodyMd,
                    alignItems: AlignItems.flexStart,
                  }}
                  as="a"
                  externalLink
                  href={getTransactionUrl(transaction.id, transaction.chain)}
                >
                  {shortenTransactionId(transaction.id)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        getTransactionUrl(transaction.id, transaction.chain),
                      )
                    }
                  />
                </ButtonLink>
              </Box>
            </Box>
          </Box>

          <Box paddingTop={4} paddingBottom={4}>
            <Divider />
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            {/* From */}
            {transaction.type === TransactionType.Send
              ? accountComponent(t('from'), userAddress)
              : assetInputs.map((input) =>
                  accountComponent(t('from'), input.address),
                )}

            {/* Amounts per token */}
            {transaction.type === TransactionType.Swap
              ? assetInputs.map((input, index) => (
                  <>
                    {accountComponent(t('to'), assetOutputs[index].address)}
                    {amountComponent(input, t('amount'), 'transaction-amount')}
                  </>
                ))
              : assetOutputs.map((output) => (
                  <>
                    {accountComponent(t('to'), output.address)}
                    {amountComponent(output, t('amount'), 'transaction-amount')}
                  </>
                ))}

            {/* Base Fees */}
            {baseFee.map((fee) =>
              amountComponent(fee, t('networkFee'), 'transaction-base-fee'),
            )}

            {/* Priority Fees */}
            {priorityFee.map((fee) =>
              amountComponent(
                fee,
                t('priorityFee'),
                'transaction-priority-fee',
              ),
            )}
          </Box>
        </Box>

        <Box paddingTop={4}>
          <Divider />
        </Box>

        <ModalFooter>
          <Button
            block
            size={ButtonSize.Md}
            variant={ButtonVariant.Link}
            onClick={() => {
              global.platform.openTab({
                url: getTransactionUrl(transaction.id, transaction.chain),
              });

              trackEvent({
                event: MetaMetricsEventName.ExternalLinkClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  link_type: MetaMetricsEventLinkType.AccountTracker,
                  location: 'Transaction Details',
                  url_domain: getURLHostName(
                    getTransactionUrl(transaction.id, transaction.chain),
                  ),
                },
              });
            }}
            endIconName={IconName.Export}
          >
            {t('viewDetails')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
