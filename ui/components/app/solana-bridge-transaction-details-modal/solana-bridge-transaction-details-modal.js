import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  getBridgeStatusKey,
  isBridgeComplete,
  isBridgeFailed,
} from '../../../../shared/lib/bridge-status';
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
  BackgroundColor,
} from '../../../helpers/constants/design-system';
// import { useI18nContext } from '../../../hooks/useI18nContext';
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
import {
  KEYRING_TRANSACTION_STATUS_KEY,
  useMultichainTransactionDisplay,
} from '../../../hooks/useMultichainTransactionDisplay';
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
import './index.scss';

/**
 * Modal component for displaying Solana bridge transaction details
 *
 * @param options0
 * @param options0.transaction
 * @param options0.onClose
 * @param options0.userAddress
 */
function SolanaBridgeTransactionDetailsModal({
  transaction,
  onClose,
  userAddress,
}) {
  // TODO: add translations.
  // const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const { id, timestamp, chain, status, baseFee, asset } =
    useMultichainTransactionDisplay({ transaction, userAddress });

  const bridgeInfo = transaction.bridgeInfo || {};

  // Get the transaction status key using shared utility
  const statusKey = getBridgeStatusKey(
    transaction,
    KEYRING_TRANSACTION_STATUS_KEY[status],
  );

  // Use shared utility functions to check transaction state
  const txComplete = isBridgeComplete(transaction);
  const txFailed = isBridgeFailed(transaction, statusKey);

  // Set display status based on transaction state
  let displayStatus = 'In Progress';
  let statusColor = TextColor.primaryDefault;

  if (txComplete) {
    displayStatus = 'Complete';
    statusColor = TextColor.successDefault;
  } else if (txFailed) {
    displayStatus = 'Failed';
    statusColor = TextColor.errorDefault;
  }

  /**
   * Gets the correct block explorer URL for a transaction hash based on chain type
   *
   * @param {string} txHash - Transaction hash/ID
   * @param {string} chainId - Chain ID (can be EVM or Solana format)
   * @param {object} networkProps - Network properties for EVM chains
   * @returns {string} Block explorer URL for the transaction
   */
  const getChainExplorerUrl = (txHash, chainId, networkProps) => {
    if (!txHash || !chainId) {
      return '';
    }

    try {
      // Check if it's a Solana chain
      const caipChainId = formatChainIdToCaip(chainId);
      const isSolana = caipChainId === MultichainNetworks.SOLANA;

      let blockExplorerUrl = '';

      if (isSolana) {
        // Handle Solana chains
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

  /**
   * Format destination token amount based on decimals
   *
   * @param {string} amount - Amount in base units
   * @param {number} decimals - Number of decimals
   * @returns {string} Formatted amount
   */
  const formatDestTokenAmount = (amount, decimals = 18) => {
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
            Bridge details
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
          overflow="auto"
          flex="1"
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
                  Status
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
                  Transaction ID
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
              {bridgeInfo?.destTxHash && (
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    Destination Tx ID
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
                        bridgeInfo.destTxHash,
                        bridgeInfo.destChainId,
                        { blockExplorerUrl: bridgeInfo.destBlockExplorerUrl },
                      )}
                    >
                      {shortenTransactionId(bridgeInfo.destTxHash)}
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

              {/* Timestamp */}
              {/* <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  Timestamp
                </Text>
                <Text
                  variant={TextVariant.bodyMd}
                  className="solana-bridge-transaction-details-modal__timestamp"
                >
                  {formatTimestamp(timestamp)}
                </Text>
              </Box> */}
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
                Bridging
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
                  From
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
                    borderColor={BackgroundColor.backgroundDefault}
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
                  To
                </Text>
                <Box
                  display={Display.Flex}
                  gap={2}
                  alignItems={AlignItems.center}
                >
                  <AvatarNetwork
                    size={AvatarNetworkSize.Sm}
                    className="solana-bridge-transaction-details-modal__network-badge"
                    name={bridgeInfo?.destChainName || ''}
                    src={
                      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                        bridgeInfo?.destChainId
                      ] || ''
                    }
                    borderColor={BackgroundColor.backgroundDefault}
                  />
                  <Text variant={TextVariant.bodyMd}>
                    {bridgeInfo?.destChainName || ''}
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
                  You sent
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
                      if (asset?.amount) {
                        return `${asset.amount.replace('-', '')} ${asset.unit}`;
                      } else if (transaction.from?.[0]?.asset?.amount) {
                        return `${transaction.from[0].asset.amount.replace(
                          '-',
                          '',
                        )} ${transaction.from[0].asset.unit}`;
                      }
                      return '';
                    })()}
                  </Text>
                  {/* <Box
                    display={Display.Flex}
                    gap={1}
                    alignItems={AlignItems.center}
                  >
                    <AvatarNetwork
                      size={AvatarNetworkSize.Xs}
                      name={
                        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA]
                          .nickname
                      }
                      src={SOLANA_TOKEN_IMAGE_URL}
                      borderColor={BackgroundColor.backgroundDefault}
                    />
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      {
                        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA]
                          .nickname
                      }
                    </Text>
                  </Box> */}
                </Box>
              </Box>

              {/* Destination Amount */}
              {bridgeInfo?.destAsset && bridgeInfo?.destTokenAmount && (
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    You received
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
                    {/* <Box
                      display={Display.Flex}
                      gap={1}
                      alignItems={AlignItems.center}
                    >
                      <AvatarNetwork
                        size={AvatarNetworkSize.Xs}
                        name={bridgeInfo?.destChainName || ''}
                        src={
                          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                            bridgeInfo?.destChainId
                          ] || ''
                        }
                        borderColor={BackgroundColor.backgroundDefault}
                      />
                      <Text
                        variant={TextVariant.bodySm}
                        color={TextColor.textAlternative}
                      >
                        {bridgeInfo?.destChainName || ''}
                      </Text>
                    </Box> */}
                  </Box>
                </Box>
              )}

              {/* Gas Fee */}
              {baseFee && (
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    Total gas fee
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
                      {baseFee.amount} {baseFee.unit}
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
                  link_type: MetaMetricsEventLinkType.AccountTracker,
                  location: 'Transaction Details',
                  url_domain: getURLHostName(getTransactionUrl(id, chain)),
                },
              });
            }}
            endIconName={IconName.Export}
          >
            View on explorer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

SolanaBridgeTransactionDetailsModal.propTypes = {
  transaction: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  userAddress: PropTypes.string.isRequired,
};

export default SolanaBridgeTransactionDetailsModal;
