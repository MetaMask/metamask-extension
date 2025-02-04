import React, { useContext } from 'react';
import { capitalize } from 'lodash';
import { Transaction, TransactionStatus } from '@metamask/keyring-api';
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
import { shortenAddress } from '../../../helpers/utils/util';
import {
  formatTimestamp,
  getTransactionUrl,
  getAddressUrl,
  shortenTransactionId,
} from './helpers';

export type MultichainTransactionDetailsModalProps = {
  transaction: Transaction;
  onClose: () => void;
  addressLink: string;
};

export function MultichainTransactionDetailsModal({
  transaction,
  onClose,
  addressLink,
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

  const getAssetDisplay = (asset: typeof fromAsset) => {
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

  if (!transaction?.from?.[0] || !transaction?.to?.[0]) {
    return null;
  }

  // We only support 1 recipient for "from" and "to" for now:
  const {
    id: txId,
    from: [{ address: fromAddress, asset: fromAsset }],
    to: [{ address: toAddress }],
    fees: [{ asset: feeAsset }],
    fees,
    timestamp,
    status,
    chain,
    type,
  } = transaction;

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
                  href={getTransactionUrl(txId, chain)}
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
                  href={getTransactionUrl(txId, chain)}
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
                  {getAssetDisplay(fromAsset)}
                </Text>
              </Box>
            </Box>

            {/* Network Fee */}
            {fees?.length > 0 && (
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
                    {getAssetDisplay(feeAsset)}
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
