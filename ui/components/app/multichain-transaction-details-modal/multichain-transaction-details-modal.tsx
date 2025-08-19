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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function MultichainTransactionDetailsModal({
  transaction,
  onClose,
  userAddress,
  networkConfig,
}: MultichainTransactionDetailsModalProps) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  const {
    from,
    to,
    isRedeposit,
    baseFee,
    priorityFee,
    status,
    chain,
    type,
    timestamp,
    id,
  } = useMultichainTransactionDisplay(transaction, networkConfig);

  const getStatusColor = (txStatus: string) => {
    switch (txStatus?.toLowerCase()) {
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
  const statusKey = KEYRING_TRANSACTION_STATUS_KEY[status];

  const accountComponent = (label: string, address?: string) =>
    address ? (
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
          {label}
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
            href={getAddressUrl(address, chain)}
          >
            {shortenAddress(address)}
            <Icon
              marginLeft={2}
              name={IconName.Export}
              size={IconSize.Sm}
              color={IconColor.primaryDefault}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={() =>
                navigator.clipboard.writeText(
                  getAddressUrl(address as string, chain),
                )
              }
            />
          </ButtonLink>
        </Box>
      </Box>
    ) : null;

  const amountComponent = (
    asset:
      | {
          amount: string;
          unit: string;
        }
      | undefined,
    label: string,
    dataTestId: string,
  ) => {
    if (!asset) {
      return null;
    }

    return (
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
          {label}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexEnd}
        >
          <Text variant={TextVariant.bodyMd} data-testid={dataTestId}>
            {asset.amount} {asset.unit}
          </Text>
        </Box>
      </Box>
    );
  };

  const typeToTitle: Partial<Record<TransactionType, string>> = {
    // TODO: Add support for other transaction types
    [TransactionType.Send]: t('send'),
    [TransactionType.Receive]: t('receive'),
    [TransactionType.Swap]: t('swap'),
    [TransactionType.Unknown]: t('interaction'),
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
            {capitalize(isRedeposit ? t('redeposit') : typeToTitle[type])}
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
            {status && (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('status')}
                </Text>
                <Text
                  variant={TextVariant.bodyMd}
                  color={getStatusColor(status)}
                >
                  {capitalize(t(statusKey))}
                </Text>
              </Box>
            )}

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
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
            {type === TransactionType.Send
              ? accountComponent(t('from'), userAddress)
              : accountComponent(t('from'), from?.address)}

            {/* Amounts per token */}
            <>
              {accountComponent(t('to'), to?.address)}
              {amountComponent(
                type === TransactionType.Swap ? from : to,
                t('amount'),
                'transaction-amount',
              )}
            </>
            {/* Base Fees */}
            {amountComponent(baseFee, t('networkFee'), 'transaction-base-fee')}
            {/* Priority Fees */}
            {amountComponent(
              priorityFee,
              t('priorityFee'),
              'transaction-priority-fee',
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
                url: getTransactionUrl(id, chain),
              });

              trackEvent({
                event: MetaMetricsEventName.ExternalLinkClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  link_type: MetaMetricsEventLinkType.AccountTracker,
                  location: 'Transaction Details',
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
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
