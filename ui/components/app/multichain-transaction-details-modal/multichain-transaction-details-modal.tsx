import React, { useContext } from 'react';
import { capitalize } from 'lodash';
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
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { ConfirmInfoRowDivider as Divider } from '../confirm/info/row';
import { MultichainNetwork } from '../../../selectors/multichain';
import {
  formatDateWithYearContext,
  shortenAddress,
} from '../../../helpers/utils/util';

type Asset = {
  fungible: boolean;
  type: string;
  unit: string;
  amount: string;
};

type TransactionFrom = {
  address: string;
  asset: Asset;
};

type TransactionTo = {
  address: string;
  asset: Asset;
};

type Transaction = {
  type: string;
  status: string;
  timestamp?: number;
  id: string;
  from: TransactionFrom[];
  to: TransactionTo[];
  fees: {
    type: string;
    asset: Asset;
  }[];
};

type MultichainTransactionDetailsModalProps = {
  transaction: Transaction;
  onClose: () => void;
  addressLink: string;
  multichainNetwork: MultichainNetwork;
};

export function MultichainTransactionDetailsModal({
  transaction,
  onClose,
  addressLink,
  multichainNetwork,
}: MultichainTransactionDetailsModalProps) {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return TextColor.successDefault;
      case 'pending':
        return TextColor.warningDefault;
      case 'failed':
        return TextColor.errorDefault;
      default:
        return TextColor.textDefault;
    }
  };

  const blockExplorerUrl = multichainNetwork.network.rpcPrefs?.blockExplorerUrl;

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
            {capitalize(transaction.type)}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
          >
            {transaction.timestamp
              ? `${formatDateWithYearContext(
                  transaction.timestamp,
                  'MMM d, y',
                  'MMM d',
                )}, ${new Date(transaction.timestamp)
                  .toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: undefined,
                  })
                  .slice(0, 5)}`
              : ''}
          </Text>
        </ModalHeader>

        <Box paddingBottom={4}>
          <Divider />
        </Box>
        <Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={3}
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
                {capitalize(transaction.status)}
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
                  href={`${blockExplorerUrl}/tx/${transaction.id}`}
                >
                  {shortenAddress(transaction.id)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${blockExplorerUrl}/tx/${transaction.id}`,
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
            gap={3}
          >
            {/* From */}
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
                {t('from')}
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
                  href={`${blockExplorerUrl}/tx/${transaction.id}`}
                >
                  {shortenAddress(transaction.from[0]?.address)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${blockExplorerUrl}/address/${transaction.from[0]?.address}`,
                      )
                    }
                  />
                </ButtonLink>
              </Box>
            </Box>

            {/* To */}
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
                {t('to')}
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
                  href={`${blockExplorerUrl}/tx/${transaction.id}`}
                >
                  {shortenAddress(transaction.to[0]?.address)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${blockExplorerUrl}/address/${transaction.to[0]?.address}`,
                      )
                    }
                  />
                </ButtonLink>
              </Box>
            </Box>

            {/* Amount */}
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
                {t('amount')}
              </Text>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.flexEnd}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  data-testid="transaction-amount"
                >
                  {transaction.from[0]?.asset?.amount}{' '}
                  {transaction.from[0]?.asset?.unit}
                </Text>
              </Box>
            </Box>

            {/* Network Fee */}
            {transaction.fees?.length > 0 && (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('networkFee')}
                </Text>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  alignItems={AlignItems.flexEnd}
                >
                  <Text variant={TextVariant.bodyMd}>
                    {`${transaction.fees[0].asset.amount} ${transaction.fees[0].asset.unit}`}
                  </Text>
                </Box>
              </Box>
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
              openBlockExplorer(addressLink, 'Transaction Details', trackEvent);
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
