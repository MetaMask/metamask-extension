import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import { calcTokenAmount } from '../../../../../shared/lib/transactions-controller-utils';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatAmount } from '../../components/simulation-details/formatAmount';
import {
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_CLAIM_CHAIN_ID,
  MUSD_TOKEN_ADDRESS,
} from '../../../../components/app/musd/constants';
import { getClaimedAmountFromContract } from '../../../../components/app/musd/merkl-client';
import { useTokenFiatRate } from '../tokens/useTokenFiatRates';

/** mUSD has 6 decimals */
const MUSD_DECIMALS = 6;

type MerklClaimParams = {
  totalAmount: string;
  userAddress: string;
  tokenAddress: string;
};

/**
 * Decode Merkl claim parameters from transaction calldata.
 * claim(address[] users, address[] tokens, uint256[] amounts, bytes32[][] proofs)
 *
 * @param data - The transaction data hex string
 * @returns Decoded claim parameters, or null if decoding fails
 */
function decodeMerklClaimParams(
  data: string | undefined,
): MerklClaimParams | null {
  if (!data || typeof data !== 'string') {
    return null;
  }

  try {
    const contractInterface = new Interface(DISTRIBUTOR_CLAIM_ABI);
    const decoded = contractInterface.decodeFunctionData('claim', data);
    const [users, tokens, amounts] = decoded;

    if (!users?.length || !tokens?.length || !amounts?.length) {
      return null;
    }

    return {
      totalAmount: amounts[0].toString(),
      userAddress: users[0],
      tokenAddress: tokens[0],
    };
  } catch {
    return null;
  }
}

type UseMerklClaimAmountResult = {
  /** Whether the async contract call is still pending */
  pending: boolean;
  /** Display-formatted claim amount (e.g. "10.50") */
  displayClaimAmount: string | undefined;
  /** Fiat-formatted claim amount (e.g. "$10.50") */
  fiatDisplayValue: string | undefined;
  /** Raw fiat value as a number */
  fiatValue: number | undefined;
};

/**
 * Hook that computes the actual claimable (unclaimed) amount for a Merkl mUSD claim transaction.
 *
 * The transaction calldata contains the cumulative total reward, not the per-claim payout.
 * The Merkl Distributor contract computes: payout = totalAmount - alreadyClaimed.
 * This hook reads the already-claimed amount from the contract and returns the unclaimed portion.
 *
 * @param transactionMeta - The transaction metadata
 * @returns Claim amount display values and loading state
 */
export const useMerklClaimAmount = (
  transactionMeta: TransactionMeta,
): UseMerklClaimAmountResult => {
  const locale = useSelector(getIntlLocale);
  const fiatFormatter = useFiatFormatter();

  // Get fiat rate for mUSD on Linea (where rewards are claimed)
  const musdFiatRate = useTokenFiatRate(
    MUSD_TOKEN_ADDRESS as Hex,
    MERKL_CLAIM_CHAIN_ID,
  );

  // Decode claim params from the calldata
  const claimParams = useMemo(() => {
    if (transactionMeta.type !== TransactionType.musdClaim) {
      return null;
    }
    return decodeMerklClaimParams(transactionMeta.txParams?.data as string);
  }, [transactionMeta.type, transactionMeta.txParams?.data]);

  // Fetch on-chain claimed amount
  const [claimedAmount, setClaimedAmount] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!claimParams) {
      setPending(false);
      return;
    }

    let cancelled = false;
    setPending(true);

    getClaimedAmountFromContract(
      claimParams.userAddress,
      claimParams.tokenAddress as Hex,
    )
      .then((result) => {
        if (!cancelled) {
          setClaimedAmount(result);
          setPending(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClaimedAmount(null);
          setPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [claimParams]);

  // Compute unclaimed amount and format for display
  const { displayClaimAmount, fiatDisplayValue, fiatValue } = useMemo(() => {
    if (pending || !claimParams) {
      return {
        displayClaimAmount: undefined,
        fiatDisplayValue: undefined,
        fiatValue: undefined,
      };
    }

    try {
      const totalRaw = BigInt(claimParams.totalAmount);
      const claimedRaw = BigInt(claimedAmount ?? '0');
      const unclaimedRaw =
        totalRaw > claimedRaw ? (totalRaw - claimedRaw).toString() : '0';

      const decimalAmount = calcTokenAmount(unclaimedRaw, MUSD_DECIMALS);
      const displayAmount = formatAmount(
        locale,
        new BigNumber(decimalAmount.toFixed()),
      );

      // mUSD is pegged ~$1. If market data gives us a rate, use it; otherwise 1:1.
      const rate = musdFiatRate ?? 1;
      const fiatVal = decimalAmount.toNumber() * rate;
      const fiatDisplay = fiatFormatter(fiatVal, { shorten: true });

      return {
        displayClaimAmount: displayAmount,
        fiatDisplayValue: fiatDisplay || undefined,
        fiatValue: fiatVal,
      };
    } catch {
      return {
        displayClaimAmount: undefined,
        fiatDisplayValue: undefined,
        fiatValue: undefined,
      };
    }
  }, [
    pending,
    claimParams,
    claimedAmount,
    locale,
    fiatFormatter,
    musdFiatRate,
  ]);

  return {
    pending,
    displayClaimAmount,
    fiatDisplayValue,
    fiatValue,
  };
};
