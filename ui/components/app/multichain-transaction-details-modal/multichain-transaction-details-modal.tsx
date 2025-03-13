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
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventLinkType,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ConfirmInfoRowDivider as Divider } from '../confirm/info/row';
import { getURLHostName, shortenAddress } from '../../../helpers/utils/util';
import { useMultichainTransactionDisplay } from '../../../hooks/useMultichainTransactionDisplay';
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

  const {
    id,
    type,
    timestamp,
    chain,
    status,
    from,
    to,
    baseFee,
    priorityFee,
    asset,
  } = useMultichainTransactionDisplay({ transaction, userAddress });

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
                  href={getTransactionUrl(id, chain)}
                >
                  {shortenTransactionId(id)}
                  <Icon
                    marginLeft={2}
                    name={IconName.Export}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        getTransactionUrl(id, chain),
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
            {from?.address && (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
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
                    href={getAddressUrl(from.address, chain)}
                  >
                    {shortenAddress(from.address)}
                    <Icon
                      marginLeft={2}
                      name={IconName.Export}
                      size={IconSize.Sm}
                      color={IconColor.primaryDefault}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          getAddressUrl(from.address as string, chain),
                        )
                      }
                    />
                  </ButtonLink>
                </Box>
              </Box>
            )}

            {/* To */}
            {to?.address && (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
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
                    href={getAddressUrl(to.address, chain)}
                  >
                    {shortenAddress(to.address)}
                    <Icon
                      marginLeft={2}
                      name={IconName.Export}
                      size={IconSize.Sm}
                      color={IconColor.primaryDefault}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          getAddressUrl(to.address as string, chain),
                        )
                      }
                    />
                  </ButtonLink>
                </Box>
              </Box>
            )}

            {/* Amount */}
            {asset && (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
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
                    {asset?.amount} {asset?.unit}
                  </Text>
                </Box>
              </Box>
            )}

            {/* Network Fees */}
            {baseFee ? (
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
                    {baseFee.amount} {baseFee.unit}
                  </Text>
                </Box>
              </Box>
            ) : null}

            {priorityFee ? (
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
                    {priorityFee.amount} {priorityFee.unit}
                  </Text>
                </Box>
              </Box>
            ) : null}
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
                url: getTransactionUrl(id, chain),
              });

              trackEvent({
                event: MetaMetricsEventName.ExternalLinkClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  link_type: MetaMetricsEventLinkType.AccountTracker,
                  location: 'Transaction Details',
                  url_domain: getURLHostName(getTransactionUrl(id, chain)),
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
