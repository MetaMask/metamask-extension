import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import {
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import type { CaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';
import { getImageForChainId } from '../../../selectors/multichain';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import { getSanitizedChainId } from '../../../selectors/multichain-accounts/utils';
import { selectBridgeHistoryItemByHash } from '../../../ducks/bridge-status/selectors';
import type { MetaMaskReduxState } from '../../../store/store';
import { NetworkName } from '../../../components/app/transaction/network-name';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { AccountName } from '../../../components/app/transaction/account-name';
import { TransactionId } from '../../../components/app/transaction/transaction-id';
import { isValidTransactionHash } from '../../../../shared/lib/transactions.utils';
import { Footer, Row, Section } from '../components/shared';
import { TokenRow } from '../components/token-row';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { BridgeExplorerButtons } from '../components/bridge-explorer-buttons';
import { SwapAgainButton } from '../components/swap-again-button';

const BridgeNetworkRow = ({
  fromChainId,
  toChainId,
}: {
  fromChainId: string;
  toChainId: string;
}) => {
  const config = useSelector(getAllNetworkConfigurationsByCaipChainId);

  const fromNetwork = config[fromChainId as CaipChainId];
  const toNetwork = config[toChainId as CaipChainId];

  const fromName = fromNetwork?.name ?? fromChainId;
  const toName = toNetwork?.name ?? toChainId;

  const fromSrc = getImageForChainId(
    isNonEvmChainId(fromChainId)
      ? fromChainId
      : formatChainIdToHex(fromChainId),
  );
  const toSrc = getImageForChainId(
    isNonEvmChainId(toChainId) ? toChainId : formatChainIdToHex(toChainId),
  );

  return (
    <div className="inline-flex items-center gap-2">
      <AvatarNetwork
        className="rounded"
        size={AvatarNetworkSize.Xs}
        name={fromName}
        src={fromSrc}
      />
      <span>{fromName}</span>
      <span>→</span>
      <AvatarNetwork
        className="rounded"
        size={AvatarNetworkSize.Xs}
        name={toName}
        src={toSrc}
      />
      <span>{toName}</span>
    </div>
  );
};

export function BridgeDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'bridge' }>;
}) {
  const t = useI18nContext();
  const { formatDateTime } = useFormatters();

  const sourceChainId = item.chainId;
  const sourceTxHash = item.hash;

  // The activity item may not always carry destination-side data (e.g. when it
  // is sourced from the API adapter, which only sees the source-chain tx).
  // Fall back to the local bridge-status history entry, which mirrors what
  // the local/keyring adapters use for enrichment via `quote.destAsset`.
  const bridgeHistoryItem = useSelector((state) =>
    sourceTxHash
      ? selectBridgeHistoryItemByHash(
          state as MetaMaskReduxState,
          sourceTxHash,
        )
      : undefined,
  );

  const sourceToken =
    item.data.sourceToken ??
    (bridgeHistoryItem
      ? {
          direction: 'out' as const,
          amount: bridgeHistoryItem.quote.srcTokenAmount,
          assetId: bridgeHistoryItem.quote.srcAsset.assetId,
          decimals: bridgeHistoryItem.quote.srcAsset.decimals,
          symbol: bridgeHistoryItem.quote.srcAsset.symbol,
        }
      : undefined);

  const destinationToken =
    item.data.destinationToken ??
    (bridgeHistoryItem
      ? {
          direction: 'in' as const,
          amount:
            bridgeHistoryItem.status.destChain?.amount ??
            bridgeHistoryItem.quote.destTokenAmount,
          assetId: bridgeHistoryItem.quote.destAsset.assetId,
          decimals: bridgeHistoryItem.quote.destAsset.decimals,
          symbol: bridgeHistoryItem.quote.destAsset.symbol,
        }
      : undefined);

  const destinationChainId = destinationToken?.assetId?.split('/')[0];

  const showFromTo = Boolean(
    destinationChainId && destinationChainId !== sourceChainId,
  );

  const txId =
    sourceTxHash &&
    (!sourceChainId.startsWith('eip155:') ||
      isValidTransactionHash(sourceTxHash))
      ? sourceTxHash
      : undefined;

  const { destTxHash, destinationAccountAddress, fromAddress } = useSelector(
    (state) => {
      const resolvedFromAddress =
        item.data.from || bridgeHistoryItem?.account || undefined;
      let toAddress: string | undefined;

      if (resolvedFromAddress && destinationChainId && showFromTo) {
        const sanitizedDestChainId = getSanitizedChainId(
          destinationChainId as CaipChainId,
        );
        toAddress = getAccountGroupsByAddress(
          state as MultichainAccountsState,
          [resolvedFromAddress],
        )[0]?.accounts.find((account) =>
          account.scopes.includes(sanitizedDestChainId),
        )?.address;
      }

      return {
        destTxHash: bridgeHistoryItem?.status.destChain?.txHash,
        destinationAccountAddress: toAddress,
        fromAddress: resolvedFromAddress,
      };
    },
  );
  const showFromToAccountRows = Boolean(
    showFromTo &&
    fromAddress &&
    destinationAccountAddress &&
    fromAddress.toLowerCase() !== destinationAccountAddress.toLowerCase(),
  );

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <div className="flex flex-col gap-2 pb-4">
          {sourceToken && (
            <div>
              <p className="text-alternative mb-1">{t('youSent')}</p>
              <TokenRow token={sourceToken} showNetworkBadge={showFromTo} />
            </div>
          )}
          {destinationToken && (
            <div>
              <p className="text-alternative mb-1">{t('youReceived')}</p>
              <TokenRow
                token={destinationToken}
                showNetworkBadge={showFromTo}
              />
            </div>
          )}
        </div>

        <Section>
          <Row
            label={t('status')}
            value={<TransactionStatus status={item.status} />}
          />
          <Row label={t('date')} value={formatDateTime(item.timestamp)} />
          {showFromToAccountRows ? (
            <>
              <Row
                label={t('from')}
                value={<AccountName address={fromAddress} />}
              />
              <Row
                label={t('to')}
                value={<AccountName address={destinationAccountAddress} />}
              />
            </>
          ) : (
            <Row
              label={t('account')}
              value={<AccountName address={fromAddress} />}
            />
          )}
          <Row
            label={t('network')}
            value={
              showFromTo && destinationChainId ? (
                <BridgeNetworkRow
                  fromChainId={sourceChainId}
                  toChainId={destinationChainId}
                />
              ) : (
                <NetworkName chainId={sourceChainId} />
              )
            }
          />
          <Row
            label={t('transactionIdLabel')}
            value={txId ? <TransactionId value={txId} /> : null}
          />
        </Section>

        <Section>
          <FeesRows item={item} />
          <TotalAmountRow token={sourceToken} />
        </Section>
      </div>
      <Footer>
        <BridgeExplorerButtons
          sourceChainId={item.chainId}
          sourceTxHash={sourceTxHash}
          destChainId={destinationChainId}
          destTxHash={destTxHash}
        />
        <SwapAgainButton
          sourceToken={sourceToken}
          destinationToken={destinationToken}
        />
      </Footer>
    </div>
  );
}
