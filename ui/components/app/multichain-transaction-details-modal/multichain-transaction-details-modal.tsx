import React, { useContext } from 'react';
import { capitalize } from 'lodash';
import {
  Transaction,
  TransactionStatus,
  Asset,
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
  formatTimestamp,
  getTransactionUrl,
  getAddressUrl,
  shortenTransactionId,
} from './helpers';

export type MultichainTransactionDetailsModalProps = {
  transaction: Transaction;
  onClose: () => void;
  userAddress: string;
};

export function MultichainTransactionDetailsModal({
  transaction,
  onClose,
  userAddress,
}: MultichainTransactionDetailsModalProps) {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getAssetDisplay = (asset: Asset | null) => {
    if (!asset) {
      return null;
    }
    if (asset.fungible === true) {
      return `${asset.amount} ${asset.unit}`;
    }
    if (asset.fungible === false) {
      return asset.id;
    }
    return null;
  };

  const { id: txId, fees, timestamp, status, chain, type } = transaction;

  let fromAddress, toAddress, asset;

  const txFromEntry = transaction.from?.find(
    (entry) => entry?.address === userAddress,
  );
  const txToEntry = transaction.to?.find(
    (entry) => entry?.address === userAddress,
  );

  switch (type) {
    case TransactionType.Swap:
      fromAddress = txFromEntry?.address || '';
      toAddress = txToEntry?.address || '';
      asset = txFromEntry?.asset || null;
      break;
    case TransactionType.Send:
      fromAddress =
        txFromEntry?.address || transaction.from?.[0]?.address || '';
      toAddress = transaction.to?.[0]?.address || '';
      asset = txFromEntry?.asset || transaction.from?.[0]?.asset || null;
      break;
    case TransactionType.Receive:
      fromAddress = transaction.from?.[0]?.address || '';
      toAddress = txToEntry?.address || transaction.to?.[0]?.address || '';
      asset = txToEntry?.asset || transaction.to?.[0]?.asset || null;
      break;
    default:
      fromAddress = transaction.from?.[0]?.address || '';
      toAddress = transaction.to?.[0]?.address || '';
      asset = transaction.to?.[0]?.asset || null;
  }

  const baseFee = fees?.find((fee) => fee.type === 'base')?.asset;
  const priorityFee = fees?.find((fee) => fee.type === 'priority')?.asset;

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
            {capitalize(type)}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
          >
            {formatTimestamp(timestamp)}
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
              <Text variant={TextVariant.bodyMd} color={getStatusColor(status)}>
                {capitalize(status)}
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
                  href={getTransactionUrl(txId, chain)}
                >
                  {shortenTransactionId(txId)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        getTransactionUrl(txId, chain),
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
                  href={getAddressUrl(fromAddress, chain)}
                >
                  {shortenAddress(fromAddress)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        getAddressUrl(fromAddress, chain),
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
                  href={getAddressUrl(toAddress, chain)}
                >
                  {shortenAddress(toAddress)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        getAddressUrl(toAddress, chain),
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
                  {getAssetDisplay(asset)}
                </Text>
              </Box>
            </Box>

            {/* Network Fees */}
            {fees?.length > 0 && (
              <>
                {baseFee && (
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
                      <Text
                        variant={TextVariant.bodyMd}
                        data-testid="transaction-base-fee"
                      >
                        {getAssetDisplay(baseFee)}
                      </Text>
                    </Box>
                  </Box>
                )}

                {priorityFee && (
                  <Box
                    display={Display.Flex}
                    justifyContent={JustifyContent.spaceBetween}
                  >
                    <Text
                      variant={TextVariant.bodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {t('priorityFee')}
                    </Text>
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      alignItems={AlignItems.flexEnd}
                    >
                      <Text
                        variant={TextVariant.bodyMd}
                        data-testid="transaction-priority-fee"
                      >
                        {getAssetDisplay(priorityFee)}
                      </Text>
                    </Box>
                  </Box>
                )}
              </>
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
                url: getTransactionUrl(txId, chain),
              });

              trackEvent({
                event: MetaMetricsEventName.ExternalLinkClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  link_type: MetaMetricsEventLinkType.AccountTracker,
                  location: 'Transaction Details',
                  url_domain: getURLHostName(getTransactionUrl(txId, chain)),
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
