import React, { useMemo } from 'react';
import type { CaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getAccountGroupsByAddress } from '../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../selectors/multichain-accounts/account-tree.types';
import { getSanitizedChainId } from '../../../../selectors/multichain-accounts/utils';
import { NetworkName } from '../../../../components/app/transaction/network-name';
import { TransactionStatus } from '../../../../components/app/transaction/transaction-status';
import { AccountName } from '../../../../components/app/transaction/account-name';
import { TransactionId } from '../../../../components/app/transaction/transaction-id';
import { isValidTransactionHash } from '../../../../../shared/lib/transactions.utils';
import { Footer, Row, Section } from '../../components/shared';
import { TokenRow } from '../../components/token-row';
import { FeesRows, TotalAmountRow } from '../../components/amounts-section';
import { BridgeExplorerButtons } from '../../components/bridge-explorer-buttons';
import { SwapAgainButton } from '../../components/swap-again-button';
import { useHistoryTokens, useBridgeHistoryItem } from './hooks';
import { BridgeNetworkRow } from './bridge-network-row';

export function BridgeDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type:
        | 'swap'
        | 'bridge'
        | 'convert'
        | 'lendingDeposit'
        | 'lendingWithdrawal'
        | 'wrap'
        | 'unwrap';
    }
  >;
}) {
  const t = useI18nContext();
  const { formatDateTime } = useFormatters();

  const sourceChainId = item.chainId;
  const sourceTxHash = item.hash;

  // The indexed accounts API only sees the source chain, so an API-derived
  // bridge item lacks the destination token, network and tx hash. Backfill them
  // from local bridge history so the received-token row and both source and
  // destination block explorer links render correctly.
  const bridgeHistoryItem = useBridgeHistoryItem(sourceTxHash);

  const historyTokens = useHistoryTokens(sourceTxHash);

  const sourceToken = item.data.sourceToken ?? historyTokens?.sourceToken;
  const destinationToken =
    item.data.destinationToken ?? historyTokens?.destinationToken;

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

  const destTxHash = bridgeHistoryItem?.status.destChain?.txHash;
  const fromAddress = item.data.from || bridgeHistoryItem?.account || undefined;

  const destinationAccountGroups = useSelector((state) =>
    fromAddress && destinationChainId && showFromTo
      ? getAccountGroupsByAddress(state as MultichainAccountsState, [
          fromAddress,
        ])
      : undefined,
  );

  const destinationAccountAddress = useMemo(() => {
    if (!destinationAccountGroups || !destinationChainId) {
      return undefined;
    }

    const sanitizedDestChainId = getSanitizedChainId(
      destinationChainId as CaipChainId,
    );

    return destinationAccountGroups[0]?.accounts.find((account) =>
      account.scopes.includes(sanitizedDestChainId),
    )?.address;
  }, [destinationAccountGroups, destinationChainId]);

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
