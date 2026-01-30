import React from 'react';
import {
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { getSelectedAddress } from '../../../selectors/selectors';
import { getNetworkConfigurationsByChainIdDecimal } from '../../../../shared/modules/selectors/networks';
import {
  extractCategoryAndAction,
  extractAmountAndSymbol,
  extractChainDisplayInfo as extractChainInfo,
} from '../../../helpers/transaction-mappers';
import type { TransactionForDisplay } from '../../../helpers/types';
import { formatTransactionDateTime } from '../../../pages/confirmations/components/activity/utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionForDisplay | null;
};

const getExplorerUrl = (chainId: number, hash: string): string | null => {
  const hexChainId = `0x${chainId.toString(16)}`;
  const baseUrl = CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexChainId];
  return baseUrl ? `${baseUrl}tx/${hash}` : null;
};

/**
 * Detects if a transaction actually failed based on transaction data
 * For ERC20 transfers, successful transactions MUST emit a Transfer event in logs
 * If logs array is empty, the transaction reverted/failed
 *
 * @param transaction
 * @param isError
 */
const detectActualFailure = (
  transaction: TransactionForDisplay,
  isError: boolean | undefined,
): boolean => {
  // If API already marked as error, trust that
  if (isError) {
    return true;
  }

  // Check for ERC20 transfer with empty logs (indicates failure)
  const isERC20Transfer =
    transaction.transactionType === 'ERC_20_TRANSFER' ||
    transaction.transactionProtocol === 'ERC_20';
  const hasEmptyLogs = !transaction.logs || transaction.logs.length === 0;

  if (isERC20Transfer && hasEmptyLogs) {
    return true;
  }

  return false;
};

export const ActivityDetailsModal = ({
  isOpen,
  onClose,
  transaction,
}: Props) => {
  const t = useI18nContext();
  const { formatToken } = useFormatters();
  const selectedAddress = useSelector(getSelectedAddress)?.toLowerCase();
  const networkConfigsByChainIdDecimal = useSelector(
    getNetworkConfigurationsByChainIdDecimal,
  );

  if (!transaction) {
    return null;
  }

  const { action } = extractCategoryAndAction(
    transaction,
    selectedAddress,
    t as (key: string, substitutions?: string[]) => string,
  );

  const { amount, symbol } = extractAmountAndSymbol(
    transaction,
    selectedAddress,
    networkConfigsByChainIdDecimal,
  );

  const { chainImageUrl, chainName } = extractChainInfo(transaction.chainId);

  const {
    hash,
    timestamp,
    from,
    chainId,
    isError,
    gasUsed,
    effectiveGasPrice,
    value,
  } = transaction;

  // Detect actual failure status (checks logs for ERC20 transfers)
  const actuallyFailed = detectActualFailure(transaction, isError);

  const explorerUrl = getExplorerUrl(chainId, hash);

  // Format date and time
  const { time, date } = formatTransactionDateTime(Number(timestamp));
  const formattedDate = `${date} at ${time}`;

  // Calculate network fee (gas used * effective gas price)
  const networkFeeWei =
    gasUsed && effectiveGasPrice
      ? BigInt(gasUsed) * BigInt(effectiveGasPrice)
      : BigInt(0);
  const networkFeeEth = Number(networkFeeWei) / 10 ** 18;

  // Calculate total amount (value + network fee for sends)
  const valueWei = BigInt(value || '0');
  const totalWei = valueWei + networkFeeWei;
  const totalEth = Number(totalWei) / 10 ** 18;

  // Detect swap transactions
  const isSwap =
    transaction.transactionType === 'SWAP' ||
    transaction.transactionProtocol?.includes('SWAP');

  // Detect bridge transactions
  const isBridge =
    transaction.transactionType === 'BRIDGE' ||
    transaction.transactionProtocol?.includes('BRIDGE');

  // Extract amounts for swap/bridge
  let fromAmount = amount;
  let fromSymbol = symbol;
  let toAmount = 0;
  let toSymbol = '';

  if ((isSwap || isBridge) && transaction.valueTransfers) {
    const transfers = transaction.valueTransfers;
    if (transfers.length >= 2) {
      // First transfer is "from"
      fromAmount = parseFloat(transfers[0].amount) / 10 ** transfers[0].decimal;
      fromSymbol = transfers[0].symbol;
      // Second transfer is "to"
      toAmount = parseFloat(transfers[1].amount) / 10 ** transfers[1].decimal;
      toSymbol = transfers[1].symbol;
    }
  }

  const status = actuallyFailed ? 'Failed' : 'Confirmed';
  const statusColor = actuallyFailed
    ? 'text-error-default'
    : 'text-success-default';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{action}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            {/* Amount Section */}
            {isSwap || isBridge ? (
              <div className="flex flex-col gap-4">
                {/* You sent */}
                <div className="flex flex-col gap-2">
                  <Text className="text-text-alternative text-sm">
                    You sent
                  </Text>
                  <div className="flex items-center gap-3">
                    <AvatarToken
                      src=""
                      symbol={fromSymbol}
                      size={AvatarTokenSize.Md}
                    />
                    <Text className="text-2xl font-medium">
                      -{Math.abs(fromAmount)} {fromSymbol}
                    </Text>
                  </div>
                </div>

                {/* You received */}
                <div className="flex flex-col gap-2">
                  <Text className="text-text-alternative text-sm">
                    You received
                  </Text>
                  <div className="flex items-center gap-3">
                    <AvatarToken
                      src=""
                      symbol={toSymbol}
                      size={AvatarTokenSize.Md}
                    />
                    <Text className="text-2xl font-medium">
                      +{toAmount} {toSymbol}
                    </Text>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Text className="text-text-alternative text-sm">You sent</Text>
                <div className="flex items-center gap-3">
                  <AvatarToken
                    src=""
                    symbol={symbol}
                    size={AvatarTokenSize.Md}
                  />
                  <Text className="text-2xl font-medium">
                    {amount > 0 ? '+' : ''}
                    {amount} {symbol}
                  </Text>
                </div>
              </div>
            )}

            <div className="h-px bg-border-muted" />

            {/* From */}
            <div className="flex items-start justify-between">
              <Text className="text-text-alternative">From</Text>
              <Text className="font-medium">{shortenAddress(from)}</Text>
            </div>

            {/* To */}
            <div className="flex items-start justify-between">
              <Text className="text-text-alternative">To</Text>
              <Text className="font-medium">
                {shortenAddress(transaction.to)}
              </Text>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between">
              <Text className="text-text-alternative">Date</Text>
              <Text className="font-medium">{formattedDate}</Text>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between">
              <Text className="text-text-alternative">Network</Text>
              <div className="flex items-center gap-2">
                <AvatarNetwork
                  name={chainName}
                  src={chainImageUrl}
                  size={AvatarNetworkSize.Xs}
                />
                <Text className="font-medium">{chainName}</Text>
              </div>
            </div>

            {/* Network fee */}
            <div className="flex items-center justify-between">
              <Text className="text-text-alternative">Network fee</Text>
              <Text className="font-medium">
                {formatToken(networkFeeEth, 'ETH')}
              </Text>
            </div>

            <div className="h-px bg-border-muted" />

            {/* Status */}
            <div className="flex items-center justify-between">
              <Text className="text-text-alternative">Status</Text>
              <Text className={statusColor}>{status}</Text>
            </div>

            {/* Transaction Hash(es) */}
            {isBridge ? (
              <>
                <div className="flex items-start justify-between">
                  <Text className="text-text-alternative">
                    Transaction hash #1
                  </Text>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-default hover:text-primary-default-hover"
                    >
                      View on Explorer ↗
                    </a>
                  ) : (
                    <Text className="text-xs text-text-alternative">
                      {shortenAddress(hash)}
                    </Text>
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <Text className="text-text-alternative">
                    Transaction hash #2
                  </Text>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-default hover:text-primary-default-hover"
                    >
                      View on Lineascan ↗
                    </a>
                  ) : (
                    <Text className="text-xs text-text-alternative">
                      {shortenAddress(hash)}
                    </Text>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-start justify-between">
                <Text className="text-text-alternative">Transaction hash</Text>
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-default hover:text-primary-default-hover"
                  >
                    View on Explorer ↗
                  </a>
                ) : (
                  <Text className="text-xs text-text-alternative">
                    {shortenAddress(hash)}
                  </Text>
                )}
              </div>
            )}

            {/* Earned points - skip for now as this is specific to certain transactions */}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
