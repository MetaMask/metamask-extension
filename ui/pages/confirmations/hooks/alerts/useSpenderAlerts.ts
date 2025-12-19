import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { NftContract } from '@metamask/assets-controllers';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { isSignatureTransactionType } from '../../utils';
import { SignatureRequestType } from '../../types/confirm';
import {
  parseTypedDataMessage,
  parseApprovalTransactionData,
} from '../../../../../shared/modules/transaction.utils';
import { PRIMARY_TYPES_PERMIT } from '../../../../../shared/constants/signatures';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { DAI_CONTRACT_ADDRESS } from '../../components/confirm/info/shared/constants';
import { selectERC20TokensByChain } from '../../../../selectors';
import { getNftContractsByAddressByChain } from '../../../../selectors/nft';

type ERC20TokensByChain = Record<
  string,
  { data?: Record<string, unknown> } | undefined
>;

type NftContractsByAddressByChain = Record<
  string,
  Record<string, NftContract> | undefined
>;

/**
 * Determines if a transaction or signature is a revoke operation.
 * Revokes should not show blocking alerts since the user is performing
 * the safe action of removing a permission.
 *
 * @param currentConfirmation - The current confirmation object
 * @param erc20TokensByChain - ERC20 tokens cache from selector
 * @param nftContractsByChain - NFT contracts cache from selector
 * @returns boolean indicating if this is a revoke operation
 */
function isRevokeOperation(
  currentConfirmation: TransactionMeta | SignatureRequestType | undefined,
  erc20TokensByChain: ERC20TokensByChain,
  nftContractsByChain: NftContractsByAddressByChain,
): boolean {
  if (!currentConfirmation) {
    return false;
  }

  const transactionMeta = currentConfirmation as TransactionMeta;
  const txData = transactionMeta.txParams?.data;

  if (txData) {
    const approvalData = parseApprovalTransactionData(txData as `0x${string}`);
    if (approvalData) {
      if (approvalData.isRevokeAll) {
        return true;
      }
      if (approvalData.amountOrTokenId?.isZero()) {
        const { chainId } = transactionMeta;
        const tokenAddress = (
          approvalData.tokenAddress || transactionMeta.txParams?.to
        )?.toLowerCase();

        const isKnownNFT = Boolean(
          tokenAddress &&
            chainId &&
            nftContractsByChain[chainId]?.[tokenAddress],
        );
        if (isKnownNFT) {
          return false;
        }

        const isKnownERC20 = Boolean(
          tokenAddress &&
            chainId &&
            erc20TokensByChain[chainId]?.data?.[tokenAddress],
        );
        if (isKnownERC20) {
          return true;
        }
      }
    }
  } else if (
    isSignatureTransactionType(currentConfirmation) &&
    currentConfirmation.type === 'eth_signTypedData'
  ) {
    const signatureRequest = currentConfirmation as SignatureRequestType;
    const msgData = signatureRequest.msgParams?.data as string;

    if (msgData) {
      const typedDataMessage = parseTypedDataMessage(msgData);
      const { primaryType, message, domain } = typedDataMessage;

      if (PRIMARY_TYPES_PERMIT.some((type) => type === primaryType)) {
        if (
          message?.allowed === false &&
          domain?.verifyingContract === DAI_CONTRACT_ADDRESS
        ) {
          return true;
        }
        const value = message?.value;
        if (value === '0' || value === 0) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Hook to generate alerts for spender addresses in approval transactions and permit signatures.
 * Supports both warning and malicious states using the trust signals system.
 * Does not return alerts for revoke operations since revoking is the safe action.
 *
 * @returns Array of alerts for spender addresses
 */
export function useSpenderAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const erc20TokensByChain = useSelector(
    selectERC20TokensByChain,
  ) as ERC20TokensByChain;
  const nftContractsByChain = useSelector(
    getNftContractsByAddressByChain,
  ) as NftContractsByAddressByChain;

  const isRevoke = useMemo(
    () =>
      isRevokeOperation(
        currentConfirmation,
        erc20TokensByChain,
        nftContractsByChain,
      ),
    [currentConfirmation, erc20TokensByChain, nftContractsByChain],
  );

  const spenderAddress = useMemo(() => {
    if (!currentConfirmation) {
      return null;
    }

    // Handle approval transactions
    const transactionMeta = currentConfirmation as TransactionMeta;
    const txData = transactionMeta.txParams?.data;

    if (txData) {
      const approvalData = parseApprovalTransactionData(
        txData as `0x${string}`,
      );
      if (approvalData?.spender) {
        return approvalData.spender;
      }
    }
    // Handle permit signatures
    else if (
      isSignatureTransactionType(currentConfirmation) &&
      currentConfirmation.type === 'eth_signTypedData'
    ) {
      const signatureRequest = currentConfirmation as SignatureRequestType;
      const msgData = signatureRequest.msgParams?.data as string;

      if (msgData) {
        const typedDataMessage = parseTypedDataMessage(msgData);
        const { primaryType } = typedDataMessage;

        if (PRIMARY_TYPES_PERMIT.some((type) => type === primaryType)) {
          return typedDataMessage.message?.spender || null;
        }
      }
    }

    return null;
  }, [currentConfirmation]);

  const { state: trustSignalDisplayState } = useTrustSignal(
    spenderAddress || '',
    NameType.ETHEREUM_ADDRESS,
    currentConfirmation?.chainId,
  );

  return useMemo(() => {
    if (!spenderAddress || isRevoke) {
      return [];
    }

    const alerts: Alert[] = [];

    if (trustSignalDisplayState === TrustSignalDisplayState.Malicious) {
      alerts.push({
        actions: [],
        field: RowAlertKey.Spender,
        isBlocking: false,
        key: 'spenderTrustSignalMalicious',
        message: t('alertMessageAddressTrustSignalMalicious'),
        reason: t('nameModalTitleMalicious'),
        severity: Severity.Danger,
      });
    } else if (trustSignalDisplayState === TrustSignalDisplayState.Warning) {
      alerts.push({
        actions: [],
        field: RowAlertKey.Spender,
        isBlocking: false,
        key: 'spenderTrustSignalWarning',
        message: t('alertMessageAddressTrustSignal'),
        reason: t('nameModalTitleWarning'),
        severity: Severity.Warning,
      });
    }

    return alerts;
  }, [spenderAddress, isRevoke, trustSignalDisplayState, t]);
}
