import React from 'react';
import { useSelector } from 'react-redux';
import { capitalize } from 'lodash';
import { TransactionStatus } from '@metamask/transaction-controller';
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
  transaction: any; // TODO: Use ExtendedTransaction | BridgeOriginatedItem
  userAddress: string;
  toggleShowDetails: (transaction: any) => void;
}

/**
 * Renders a transaction list item specifically for Solana bridge operations,
 * displaying progress across source and destination chains.
 */
const SolanaBridgeTransactionListItem: React.FC<
  SolanaBridgeTransactionListItemProps
> = ({ transaction, userAddress, toggleShowDetails }) => {
  const t = useI18nContext();
  const isSolanaAccount = useSelector(isSelectedInternalAccountSolana);

  // Extract display data, including the raw status from the source chain transaction
  const {
    type,
    status: sourceTxRawStatus,
    to,
    from,
    asset,
  } = useMultichainTransactionDisplay({
    transaction,
    userAddress,
  });

  const sourceTxStatusKey = KEYRING_TRANSACTION_STATUS_KEY[sourceTxRawStatus];

  const finalDisplayStatusKey = getBridgeStatusKey(
    transaction,
    sourceTxStatusKey,
  );

  const isBridgeFullyComplete = isBridgeComplete(transaction);

  const isBridgeFailedOrSourceFailed = isBridgeFailed(
    transaction,
    sourceTxStatusKey,
  );

  const isTerminalState = isBridgeFullyComplete || isBridgeFailedOrSourceFailed;

  const isSourceTxConfirmed = sourceTxStatusKey === TransactionStatus.confirmed;

  const statusLabelTextKey = [
    TransactionStatus.submitted,
    TransactionGroupStatus.pending,
  ].includes(
    finalDisplayStatusKey as TransactionStatus | TransactionGroupStatus,
  )
    ? undefined
    : finalDisplayStatusKey;

  let title = capitalize(type);
  if (transaction.isBridgeTx && transaction.bridgeInfo) {
    const { destChainName, provider, destChainId } = transaction.bridgeInfo;
    const displayChainName = destChainName || destChainId;
    title = `${t('bridge')} ${t('to')} ${displayChainName}`;
    if (provider) {
      title = `${title} ${t('via')} ${provider}`;
    }
  }

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
            status={finalDisplayStatusKey as TransactionGroupStatus}
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
            status={statusLabelTextKey}
            statusOnly
            className={
              isBridgeFullyComplete
                ? 'transaction-status-label--confirmed'
                : undefined
            }
          />
          {transaction.isBridgeTx &&
            transaction.bridgeInfo &&
            !isTerminalState && (
              <Box
                marginTop={2}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={1}
                width={BlockSize.Full}
              >
                <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
                  <Box
                    className="solana-bridge-transaction-list-item__segment-container"
                    width={BlockSize.Full}
                  >
                    <Box
                      className={`solana-bridge-transaction-list-item__segment ${
                        isSourceTxConfirmed
                          ? 'solana-bridge-transaction-list-item__segment--complete'
                          : 'solana-bridge-transaction-list-item__segment--pending'
                      }`}
                    />
                  </Box>

                  <Box
                    className="solana-bridge-transaction-list-item__segment-container"
                    width={BlockSize.Full}
                  >
                    {isSourceTxConfirmed && (
                      <Box className="solana-bridge-transaction-list-item__segment solana-bridge-transaction-list-item__segment--pending" />
                    )}
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
