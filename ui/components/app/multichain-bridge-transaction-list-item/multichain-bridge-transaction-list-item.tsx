import React from 'react';
import { useSelector } from 'react-redux';
import { capitalize } from 'lodash';
import { BigNumber } from 'bignumber.js';
import { type Transaction, TransactionStatus } from '@metamask/keyring-api';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import {
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
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import useBridgeChainInfo from '../../../hooks/bridge/useBridgeChainInfo';
import { formatAmount } from '../../../pages/confirmations/components/simulation-details/formatAmount';
import { getIntlLocale } from '../../../ducks/locale/locale';

type MultichainBridgeTransactionListItemProps = {
  transaction: Transaction;
  bridgeHistoryItem: BridgeHistoryItem;
  toggleShowDetails: (transaction: Transaction) => void;
};

/**
 * Renders a transaction list item specifically for Solana bridge operations,
 * displaying progress across source and destination chains.
 *
 * @param options0 - Component props
 * @param options0.transaction - The transaction data to display
 * @param options0.bridgeHistoryItem - The bridge history item data to display
 * @param options0.toggleShowDetails - Function to call when the item is clicked
 */
const MultichainBridgeTransactionListItem: React.FC<
  MultichainBridgeTransactionListItemProps
> = ({ transaction, bridgeHistoryItem, toggleShowDetails }) => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  const isSolanaAccount = useSelector(isSelectedInternalAccountSolana);

  const isSourceTxConfirmed =
    transaction.status === TransactionStatus.Confirmed;

  const { type, from } = transaction;
  const sourceAsset = from?.[0]?.asset;

  const isBridgeFullyComplete = isBridgeComplete(bridgeHistoryItem);
  const isBridgeFailedOrSourceFailed = isBridgeFailed(
    transaction,
    bridgeHistoryItem,
  );
  const isTerminalState = isBridgeFullyComplete || isBridgeFailedOrSourceFailed;

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

  const { destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
    nonEvmTransaction: transaction,
  });

  const displayChainName =
    (destNetwork?.chainId
      ? NETWORK_TO_SHORT_NETWORK_NAME_MAP[destNetwork.chainId]
      : undefined) ?? destNetwork?.chainId;

  const title = displayChainName
    ? `${t('bridgeTo')} ${displayChainName}`
    : capitalize(type);

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
            status={
              KEYRING_TRANSACTION_STATUS_KEY[transaction.status] ??
              TransactionStatus.Submitted
            }
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
            variant={TextVariant.bodyMdMedium}
          >
            {(() => {
              if (sourceAsset?.fungible) {
                const displayAmount = formatAmount(
                  locale,
                  new BigNumber(sourceAsset.amount),
                );
                return `-${displayAmount} ${bridgeHistoryItem.quote.srcAsset.symbol ?? sourceAsset.unit}`;
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
          {isTerminalState ? (
            <TransactionStatusLabel
              date={formatTimestamp(transaction.timestamp)}
              error={{}}
              status={KEYRING_TRANSACTION_STATUS_KEY[transaction.status]}
              statusOnly
              className={
                isBridgeFullyComplete
                  ? 'transaction-status-label--confirmed'
                  : undefined
              }
            />
          ) : (
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
