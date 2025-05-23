import React from 'react';
import { useSelector } from 'react-redux';
import { capitalize } from 'lodash';
import { TransactionStatus } from '@metamask/transaction-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import {
  getBridgeStatusKey,
  isBridgeComplete,
  isBridgeFailed,
} from '../../../../shared/lib/bridge-status/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isSelectedInternalAccountSolana } from '../../../selectors/accounts';
import { KEYRING_TRANSACTION_STATUS_KEY } from '../../../hooks/useMultichainTransactionDisplay';
import { formatTimestamp } from '../multichain-transaction-details-modal/helpers';
import TransactionIcon from '../transaction-icon';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import { ActivityListItem } from '../../multichain/activity-list-item/activity-list-item';
import Segment from '../../../pages/bridge/transaction-details/segment';
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
import type {
  ExtendedTransaction,
  BridgeOriginatedItem,
} from '../../../hooks/bridge/useSolanaBridgeTransactionMapping';

type MultichainBridgeTransactionListItemProps = {
  transaction: ExtendedTransaction | BridgeOriginatedItem;
  toggleShowDetails: (
    transaction: ExtendedTransaction | BridgeOriginatedItem,
  ) => void;
};

/**
 * Renders a transaction list item specifically for Solana bridge operations,
 * displaying progress across source and destination chains.
 *
 * @param options0 - Component props
 * @param options0.transaction - The transaction data to display
 * @param options0.toggleShowDetails - Function to call when the item is clicked
 */
const MultichainBridgeTransactionListItem: React.FC<
  MultichainBridgeTransactionListItemProps
> = ({ transaction, toggleShowDetails }) => {
  const t = useI18nContext();
  const isSolanaAccount = useSelector(isSelectedInternalAccountSolana);

  const { type, from, bridgeInfo, isBridgeOriginated, isSourceTxConfirmed } =
    transaction;
  const sourceAsset = from?.[0]?.asset;

  const sourceTxRawStatus = isBridgeOriginated
    ? TransactionStatus.submitted
    : (transaction as ExtendedTransaction).status;
  const sourceTxStatusKey = KEYRING_TRANSACTION_STATUS_KEY[sourceTxRawStatus];

  const finalDisplayStatusKey = getBridgeStatusKey(
    { ...transaction, isBridgeTx: transaction.isBridgeTx ?? false },
    sourceTxStatusKey,
  );
  const isBridgeFullyComplete = isBridgeComplete({
    ...transaction,
    isBridgeTx: transaction.isBridgeTx ?? false,
  });
  const isBridgeFailedOrSourceFailed = isBridgeFailed(
    { ...transaction, isBridgeTx: transaction.isBridgeTx ?? false },
    sourceTxStatusKey,
  );
  const isTerminalState = isBridgeFullyComplete || isBridgeFailedOrSourceFailed;

  const statusLabelTextKey = [
    TransactionStatus.submitted,
    TransactionGroupStatus.pending,
  ].includes(
    finalDisplayStatusKey as TransactionStatus | TransactionGroupStatus,
  )
    ? undefined
    : finalDisplayStatusKey;

  const srcSegmentStatus: StatusTypes = isSourceTxConfirmed
    ? StatusTypes.COMPLETE
    : StatusTypes.PENDING;

  let destSegmentStatus: StatusTypes | null = null;
  if (isSourceTxConfirmed) {
    destSegmentStatus = isBridgeFullyComplete
      ? StatusTypes.COMPLETE
      : StatusTypes.PENDING;
  }

  const txIndex = isSourceTxConfirmed ? 2 : 1;

  let title = capitalize(type);
  if (transaction.isBridgeTx && bridgeInfo) {
    const { destChainName, provider, destChainId } = bridgeInfo;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const displayChainName = destChainName || destChainId;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
              if (sourceAsset?.fungible) {
                const displayAmount = sourceAsset.amount;
                return `${displayAmount} ${sourceAsset.unit}`;
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
          {transaction.isBridgeTx && bridgeInfo && !isTerminalState && (
            <Box
              marginTop={0}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={1}
              width={BlockSize.Full}
            >
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodySm}
              >
                {t('bridgeTransactionProgress', [txIndex])}
              </Text>
              <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
                <Segment type={srcSegmentStatus} />
                <Segment type={destSegmentStatus} />
              </Box>
            </Box>
          )}
        </Box>
      }
    />
  );
};

export default MultichainBridgeTransactionListItem;
