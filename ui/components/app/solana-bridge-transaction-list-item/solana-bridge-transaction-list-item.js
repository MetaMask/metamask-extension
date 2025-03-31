import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { capitalize } from 'lodash';
import { TransactionStatus, TransactionType } from '@metamask/transaction-controller';
import { StatusTypes } from '../../../../shared/types/bridge-status';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isSelectedInternalAccountSolana } from '../../../selectors/accounts';
import {
  KEYRING_TRANSACTION_STATUS_KEY,
  useMultichainTransactionDisplay,
} from '../../../hooks/useMultichainTransactionDisplay';
import { formatTimestamp } from '../multichain-transaction-details-modal/helpers';
import TransactionIcon from '../transaction-icon';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import { ActivityListItem } from '../../multichain';
import {
  Display,
  FlexDirection,
  TextColor,
  BackgroundColor,
  BlockSize,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  BadgeWrapper,
  AvatarNetwork,
} from '../../component-library';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
  SOLANA_TOKEN_IMAGE_URL,
  BITCOIN_TOKEN_IMAGE_URL,
} from '../../../../shared/constants/multichain/networks';

import './index.scss';

/**
 * Helper function to format destination token amount based on decimals
 *
 * @param {string} amount - The raw token amount in base units
 * @param {number} decimals - The number of decimals for the token (defaults to 18)
 * @returns {string} Formatted token amount
 */
const formatDestTokenAmount = (amount, decimals = 18) => {
  if (!amount) {
    return '0';
  }

  // Convert from base units (like wei) to the display units (like ETH)
  try {
    const amountBN = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);

    // Integer part
    const integerPart = amountBN / divisor;

    // Decimal part with proper padding
    const remainder = amountBN % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');

    // Format with up to 4 decimal places, and trim trailing zeros
    const decimalPlaces = 4;
    const formattedDecimal = remainderStr
      .substring(0, decimalPlaces)
      .replace(/0+$/u, '');

    // Combine integer and decimal parts
    return formattedDecimal.length > 0
      ? `${integerPart}.${formattedDecimal}`
      : `${integerPart}`;
  } catch (e) {
    console.error('Error formatting destination token amount:', e);
    return amount.toString();
  }
};

/**
 * Component for Solana Bridge Transactions with EVM-style segment rendering
 *
 * @param options0
 * @param options0.transaction
 * @param options0.userAddress
 * @param options0.toggleShowDetails
 */
const SolanaBridgeTransactionListItem = ({
  transaction,
  userAddress,
  toggleShowDetails,
}) => {
  const t = useI18nContext();
  const isSolanaAccount = useSelector(isSelectedInternalAccountSolana);

  const { type, status, to, from, asset } = useMultichainTransactionDisplay({
    transaction,
    userAddress,
  });

  let title = capitalize(type);
  // For bridge transactions with a completed status, use 'confirmed' status to get the green label
  const statusKey = transaction.isBridgeTx && 
    (transaction.bridgeInfo?.status === StatusTypes.COMPLETE || 
     transaction.bridgeInfo?.status === 'COMPLETE')
    ? TransactionStatus.confirmed
    : KEYRING_TRANSACTION_STATUS_KEY[status];

  if (type === TransactionType.swap) {
    title = `${t('swap')} ${from.asset.unit} ${t('to')} ${to.asset.unit}`;
  }

  // For bridge transactions, create a more descriptive title
  if (transaction.isBridgeTx && transaction.bridgeInfo) {
    const { destChainName, provider, destChainId } = transaction.bridgeInfo;

    // Chain name fallback
    const displayChainName = destChainName || destChainId;

    // Create a detailed title with destination chain
    title = `${t('bridge')} ${t('to')} ${displayChainName}`;

    // Add provider info if available
    if (provider) {
      title = `${title} ${t('via')} ${provider}`;
    }
  }

  // Determine if this transaction is in progress or completed
  const isBridgeComplete =
    transaction.isBridgeTx &&
    transaction.bridgeInfo &&
    (transaction.bridgeInfo.status === StatusTypes.COMPLETE || 
     transaction.bridgeInfo.status === 'COMPLETE');

  return (
    <ActivityListItem
      className="solana-bridge-transaction-list-item"
      data-testid="solana-bridge-activity-item"
      onClick={() => toggleShowDetails(transaction)}
      icon={
        <BadgeWrapper
          anchorElementShape="circular"
          badge={
            <AvatarNetwork
              borderColor="background-default"
              borderWidth={1}
              className="activity-tx__network-badge"
              data-testid="activity-tx-network-badge"
              name={
                isSolanaAccount
                  ? MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA]
                      .nickname
                  : MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN]
                      .nickname
              }
              size="xs"
              src={
                isSolanaAccount
                  ? SOLANA_TOKEN_IMAGE_URL
                  : BITCOIN_TOKEN_IMAGE_URL
              }
            />
          }
          display="block"
          positionObj={{ right: -4, top: -4 }}
        >
          <TransactionIcon category="bridge" status={statusKey} />
        </BadgeWrapper>
      }
      rightContent={
        <>
          <Text
            className="activity-list-item__primary-currency"
            color="text-default"
            data-testid="transaction-list-item-primary-currency"
            ellipsis
            fontWeight="medium"
            textAlign="right"
            title="Primary Currency"
            variant="body-lg-medium"
          >
            {(() => {
              if (asset?.amount) {
                return `${asset.amount} ${asset.unit}`;
              } else if (transaction.from?.[0]?.asset?.amount) {
                return `${transaction.from[0].asset.amount} ${transaction.from[0].asset.unit}`;
              }
              return '';
            })()}
          </Text>
        </>
      }
      title={title}
      subtitle={
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={1}
        >
          <TransactionStatusLabel
            date={formatTimestamp(transaction.timestamp)}
            error={{}}
            status={statusKey}
            statusOnly
            className={
              isBridgeComplete ? 'transaction-status-label--confirmed' : undefined
            }
          />
          {/* Bridge Steps with progress bars */}
          <Box
            marginTop={2}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={1}
            width={BlockSize.Full}
          >
            <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
              {/* Source Chain Segment - Complete (100% filled) */}
              <Box
                className="solana-bridge-transaction-list-item__segment-container"
                width={BlockSize.Full}
              >
                <Box className="solana-bridge-transaction-list-item__segment solana-bridge-transaction-list-item__segment--complete" />
              </Box>

              {/* Destination Chain Segment - Dynamic based on status */}
              <Box
                className="solana-bridge-transaction-list-item__segment-container"
                width={BlockSize.Full}
              >
                <Box
                  className={`solana-bridge-transaction-list-item__segment ${
                    isBridgeComplete
                      ? 'solana-bridge-transaction-list-item__segment--complete'
                      : 'solana-bridge-transaction-list-item__segment--pending'
                  }`}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      }
    />
  );
};

SolanaBridgeTransactionListItem.propTypes = {
  transaction: PropTypes.object.isRequired,
  userAddress: PropTypes.string.isRequired,
  toggleShowDetails: PropTypes.func.isRequired,
};

export default SolanaBridgeTransactionListItem;
