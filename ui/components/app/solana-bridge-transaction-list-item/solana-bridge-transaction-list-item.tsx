import React from 'react';
import { useSelector } from 'react-redux';
import { capitalize } from 'lodash';
import {
  getBridgeStatusKey,
  isBridgeComplete,
  isBridgeFailed,
} from '../../../../shared/lib/bridge-status';
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
  BlockSize,
  TextColor,
  FontWeight,
  TextAlign,
  TextVariant,
  BorderColor,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  BadgeWrapper,
  AvatarNetwork,
  BadgeWrapperAnchorElementShape,
  AvatarNetworkSize,
} from '../../component-library';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
  SOLANA_TOKEN_IMAGE_URL,
  BITCOIN_TOKEN_IMAGE_URL,
} from '../../../../shared/constants/multichain/networks';
import {
  TransactionGroupCategory,
  TransactionGroupStatus,
} from '../../../../shared/constants/transaction';

import './index.scss';

interface SolanaBridgeTransactionListItemProps {
  transaction: any; // Using any for now, should define specific transaction type
  userAddress: string;
  toggleShowDetails: (transaction: any) => void;
}

/**
 * Component for Solana Bridge Transactions with EVM-style segment rendering
 *
 * @param options0
 * @param options0.transaction
 * @param options0.userAddress
 * @param options0.toggleShowDetails
 */
const SolanaBridgeTransactionListItem: React.FC<
  SolanaBridgeTransactionListItemProps
> = ({ transaction, userAddress, toggleShowDetails }) => {
  const t = useI18nContext();
  const isSolanaAccount = useSelector(isSelectedInternalAccountSolana);

  const { type, status, to, from, asset } = useMultichainTransactionDisplay({
    transaction,
    userAddress,
  });

  let title = capitalize(type);

  // Get the appropriate status key using the shared utility function
  const statusKey = getBridgeStatusKey(
    transaction,
    KEYRING_TRANSACTION_STATUS_KEY[status],
  );

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

  // Use shared utility functions to check transaction state
  const txComplete = isBridgeComplete(transaction);
  const txFailed = isBridgeFailed(transaction, statusKey);
  const txTerminal = txComplete || txFailed;

  return (
    <ActivityListItem
      className="solana-bridge-transaction-list-item"
      data-testid="solana-bridge-activity-item"
      onClick={() => toggleShowDetails(transaction)}
      icon={
        <BadgeWrapper
          anchorElementShape={BadgeWrapperAnchorElementShape.circular}
          badge={
            <AvatarNetwork
              borderColor={BorderColor.backgroundDefault}
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
              size={AvatarNetworkSize.Xs}
              src={
                isSolanaAccount
                  ? SOLANA_TOKEN_IMAGE_URL
                  : BITCOIN_TOKEN_IMAGE_URL
              }
            />
          }
          display={Display.Block}
          positionObj={{ right: -4, top: -4 }}
        >
          <TransactionIcon
            category={TransactionGroupCategory.bridge}
            status={statusKey as TransactionGroupStatus}
          />
        </BadgeWrapper>
      }
      rightContent={
        <>
          <Text
            className="activity-list-item__primary-currency"
            color={TextColor.textDefault}
            data-testid="transaction-list-item-primary-currency"
            ellipsis
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Right}
            title="Primary Currency"
            variant={TextVariant.bodyLgMedium}
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
              txComplete ? 'transaction-status-label--confirmed' : undefined
            }
          />
          {/* Bridge Steps with progress bars - only show for pending transactions */}
          {transaction.isBridgeTx && transaction.bridgeInfo && !txTerminal && (
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
                  <Box className="solana-bridge-transaction-list-item__segment solana-bridge-transaction-list-item__segment--pending" />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      }
    />
  );
};

export default SolanaBridgeTransactionListItem;
