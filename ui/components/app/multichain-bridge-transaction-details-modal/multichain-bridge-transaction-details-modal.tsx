import React, { useContext } from 'react';
import { getAccountLink } from '@metamask/etherscan-link';
import {
  formatChainIdToCaip,
  formatChainIdToHex,
} from '@metamask/bridge-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import { isNumber } from 'lodash';
import { getBridgeStatusKey } from '../../../../shared/lib/bridge-status/utils';
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
  BorderColor,
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
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventLinkType,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ConfirmInfoRowDivider as Divider } from '../confirm/info/row';
import { getURLHostName } from '../../../helpers/utils/util';
import { KEYRING_TRANSACTION_STATUS_KEY } from '../../../hooks/useMultichainTransactionDisplay';
import {
  formatTimestamp,
  getTransactionUrl,
  shortenTransactionId,
} from '../multichain-transaction-details-modal/helpers';
import { formatBlockExplorerTransactionUrl } from '../../../../shared/lib/multichain/networks';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
  SOLANA_TOKEN_IMAGE_URL,
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
} from '../../../../shared/constants/multichain/networks';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';
import {
  ExtendedTransaction,
  BridgeOriginatedItem,
} from '../../../hooks/bridge/useSolanaBridgeTransactionMapping';

type MultichainBridgeTransactionDetailsModalProps = {
  transaction: ExtendedTransaction | BridgeOriginatedItem;
  onClose: () => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function MultichainBridgeTransactionDetailsModal({
  transaction,
  onClose,
}: MultichainBridgeTransactionDetailsModalProps): JSX.Element {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  // --- Extract data directly from transaction ---
  const { id, timestamp, from, bridgeInfo, isBridgeOriginated } = transaction;
  const chain = transaction.network ?? transaction.chain ?? undefined;
  // Use TransactionStatus.submitted as the default
  const sourceTxRawStatus = isBridgeOriginated
    ? TransactionStatus.submitted
    : transaction.status;
  const assetData = from?.[0]?.asset;
  const baseFeeAsset = isBridgeOriginated
    ? null
    : transaction.fees?.find((fee) => fee.type === 'base')?.asset;
  // --- End direct extraction ---

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const currentBridgeInfo = bridgeInfo || {};

  const sourceTxStatusKey = KEYRING_TRANSACTION_STATUS_KEY[sourceTxRawStatus];

  // Determine final display status key using utility
  const finalDisplayStatusKey = getBridgeStatusKey(
    { ...transaction, isBridgeTx: transaction.isBridgeTx ?? false },
    sourceTxStatusKey,
  );

  // Determine display status text and color based on finalDisplayStatusKey
  let displayStatus = t('bridgeStatusInProgress');
  let statusColor = TextColor.primaryDefault;

  if (finalDisplayStatusKey === TransactionStatus.confirmed) {
    displayStatus = t('bridgeStatusComplete');
    statusColor = TextColor.successDefault;
  } else if (finalDisplayStatusKey === TransactionStatus.failed) {
    displayStatus = t('bridgeStatusFailed');
    statusColor = TextColor.errorDefault;
  }

  const getChainExplorerUrl = (
    txHash: string,
    chainId: string,
    networkProps?: { blockExplorerUrl?: string },
  ): string => {
    if (!txHash || !chainId) {
      return '';
    }

    try {
      const caipChainId = formatChainIdToCaip(chainId);
      const isSolana = caipChainId === MultichainNetworks.SOLANA;

      let blockExplorerUrl = '';

      if (isSolana) {
        const blockExplorerUrls =
          MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[caipChainId];
        if (blockExplorerUrls) {
          blockExplorerUrl = formatBlockExplorerTransactionUrl(
            blockExplorerUrls,
            txHash.split(':').at(-1) ?? txHash,
          );
        }
      } else {
        // Handle EVM chains using MetaMask's predefined block explorer URLs
        // Make sure chainId is in the correct format (0x-prefixed hex string)
        const formattedChainId = chainId.startsWith('0x')
          ? chainId
          : `0x${Number(chainId).toString(16)}`;

        // Use common mapping of chain IDs to block explorer URLs
        const explorerBaseUrl =
          CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[formattedChainId];

        if (explorerBaseUrl) {
          blockExplorerUrl = `${explorerBaseUrl}tx/${txHash}`;
        } else if (networkProps?.blockExplorerUrl) {
          // Use provided explorer URL if available
          blockExplorerUrl = getAccountLink(
            txHash,
            chainId,
            {
              blockExplorerUrl: networkProps.blockExplorerUrl,
            },
            undefined,
          );
        } else {
          // Fallback to Etherscan as a last resort
          blockExplorerUrl = `https://etherscan.io/tx/${txHash}`;
        }
      }

      return blockExplorerUrl;
    } catch (error) {
      console.error('Error generating block explorer URL:', error);
      return '';
    }
  };

  const formatDestTokenAmount = (
    amount: string | undefined,
    decimals: number | undefined = 18,
  ): string => {
    if (!amount) {
      return '0';
    }
    try {
      const amountBN = BigInt(amount);
      const divisor = BigInt(10) ** BigInt(decimals);
      const integerPart = amountBN / divisor;
      const remainder = amountBN % divisor;
      const remainderStr = remainder.toString().padStart(decimals, '0');
      const decimalPlaces = 4;
      const formattedDecimal = remainderStr
        .substring(0, decimalPlaces)
        .replace(/0+$/u, '');
      return formattedDecimal.length > 0
        ? `${integerPart}.${formattedDecimal}`
        : `${integerPart}`;
    } catch (e) {
      console.error('Error formatting destination token amount:', e);
      return amount.toString();
    }
  };

  return (
    <Modal
      onClose={onClose}
      data-testid="solana-bridge-transaction-details-modal"
      isOpen
      isClosedOnOutsideClick
      isClosedOnEscapeKey
    >
      <ModalOverlay />
      <ModalContent
        className="solana-bridge-transaction-details-modal"
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          padding: 4,
        }}
      >
        <ModalHeader onClose={onClose} padding={0}>
          <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
            {t('bridgeDetailsTitle')}
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
        {/* Scrollable Content Section */}
        <Box
          className="solana-bridge-transaction-details-modal__content"
          style={{ overflow: 'auto', flex: '1' }}
        >
          {/* Status Section */}
          <Box>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={4}
            >
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
                <Text variant={TextVariant.bodyMd} color={statusColor}>
                  {displayStatus}
                </Text>
              </Box>

              {/* Transaction ID */}
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('transactionIdLabel')}
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
                    />
                  </ButtonLink>
                </Box>
              </Box>

              {/* If destination transaction exists, show it */}
              {currentBridgeInfo?.destTxHash && (
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    {t('destinationTransactionIdLabel')}
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
                      href={getChainExplorerUrl(
                        currentBridgeInfo.destTxHash,
                        currentBridgeInfo.destChainId?.toString() ?? '',
                        {
                          blockExplorerUrl:
                            currentBridgeInfo.destBlockExplorerUrl,
                        },
                      )}
                    >
                      {shortenTransactionId(currentBridgeInfo.destTxHash)}
                      <Icon
                        marginLeft={2}
                        name={IconName.Export}
                        size={IconSize.Sm}
                        color={IconColor.primaryDefault}
                      />
                    </ButtonLink>
                  </Box>
                </Box>
              )}
            </Box>

            <Box paddingTop={4} paddingBottom={4}>
              <Divider />
            </Box>

            {/* Bridging Section */}
            <Box marginBottom={4}>
              <Text
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
                marginBottom={2}
              >
                {t('bridging')}
              </Text>

              {/* From section with source chain details */}
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
                marginBottom={2}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('from')}
                </Text>
                <Box
                  display={Display.Flex}
                  gap={2}
                  alignItems={AlignItems.center}
                >
                  <AvatarNetwork
                    size={AvatarNetworkSize.Sm}
                    className="solana-bridge-transaction-details-modal__network-badge"
                    name={
                      MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA]
                        .nickname
                    }
                    src={SOLANA_TOKEN_IMAGE_URL}
                    borderColor={BorderColor.backgroundDefault}
                  />
                  <Text variant={TextVariant.bodyMd}>
                    {
                      MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA]
                        .nickname
                    }
                  </Text>
                </Box>
              </Box>

              {/* To section with destination chain details */}
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('to')}
                </Text>
                <Box
                  display={Display.Flex}
                  gap={2}
                  alignItems={AlignItems.center}
                >
                  <AvatarNetwork
                    size={AvatarNetworkSize.Sm}
                    className="solana-bridge-transaction-details-modal__network-badge"
                    name={currentBridgeInfo?.destChainName ?? ''}
                    src={
                      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                        isNumber(currentBridgeInfo?.destChainId)
                          ? formatChainIdToHex(currentBridgeInfo?.destChainId)
                          : (currentBridgeInfo?.destChainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP)
                      ] || ''
                    }
                    borderColor={BorderColor.backgroundDefault}
                  />
                  <Text variant={TextVariant.bodyMd}>
                    {bridgeInfo?.destChainName ?? ''}
                  </Text>
                </Box>
              </Box>
            </Box>

            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={4}
            >
              {/* Source Amount */}
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('youSent')}
                </Text>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  alignItems={AlignItems.flexEnd}
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    data-testid="transaction-source-amount"
                  >
                    {(() => {
                      if (assetData?.fungible) {
                        const displayAmount = assetData.amount?.startsWith('-')
                          ? assetData.amount.substring(1)
                          : assetData.amount;
                        return `${displayAmount} ${assetData.unit}`;
                      }
                      return '';
                    })()}
                  </Text>
                </Box>
              </Box>

              {/* Destination Amount - Show only when truly complete */}
              {finalDisplayStatusKey === TransactionStatus.confirmed &&
                bridgeInfo?.destAsset &&
                bridgeInfo?.destTokenAmount && (
                  <Box
                    display={Display.Flex}
                    justifyContent={JustifyContent.spaceBetween}
                  >
                    <Text
                      variant={TextVariant.bodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {t('youReceived')}
                    </Text>
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      alignItems={AlignItems.flexEnd}
                    >
                      <Text
                        variant={TextVariant.bodyMd}
                        data-testid="transaction-dest-amount"
                      >
                        {formatDestTokenAmount(
                          bridgeInfo.destTokenAmount,
                          bridgeInfo.destAsset.decimals,
                        )}{' '}
                        {bridgeInfo.destAsset.symbol}
                      </Text>
                    </Box>
                  </Box>
                )}

              {/* Gas Fee */}
              {baseFeeAsset && baseFeeAsset.fungible && (
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    {t('transactionTotalGasFee')}
                  </Text>
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                    alignItems={AlignItems.flexEnd}
                  >
                    <Text
                      variant={TextVariant.bodyMd}
                      data-testid="transaction-gas-fee"
                    >
                      {baseFeeAsset.amount} {baseFeeAsset.unit}
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <Box paddingTop={4}>
            <Divider />
          </Box>
        </Box>
        {/* Close scrollable content */}
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
            {t('viewOnBlockExplorer')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default MultichainBridgeTransactionDetailsModal;
