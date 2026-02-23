import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import {
  addTransactionAndRouteToConfirmationPage,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import {
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_CLAIM_CHAIN_ID,
  MERKL_DISTRIBUTOR_ADDRESS,
  ELIGIBLE_TOKENS,
} from '../constants';
import { fetchMerklRewardsForAsset } from '../merkl-client';
import type { MetaMaskReduxDispatch } from '../../../../store/store';

type UseMerklClaimOptions = {
  tokenAddress: string;
  chainId: Hex;
};

/**
 * Hook to handle claiming Merkl rewards.
 * Fetches proof data from the Merkl API, builds the claim transaction,
 * and routes to the confirmation page.
 *
 * @param options - Hook options
 * @param options.tokenAddress - The token's contract address
 * @param options.chainId - The chain ID of the token
 * @returns Claim function, loading state, and error state
 */
export const useMerklClaim = ({
  tokenAddress,
  chainId,
}: UseMerklClaimOptions) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  const claimChainId = MERKL_CLAIM_CHAIN_ID;

  // Cleanup: abort any pending fetch on unmount
  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const claimRewards = useCallback(async () => {
    if (!selectedAddress) {
      const errorMessage = 'No account selected';
      setError(errorMessage);
      setIsClaiming(false);
      return;
    }

    // Abort any previous in-flight request
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsClaiming(true);
    setError(null);

    try {
      // Fetch claim data (includes Merkle proof) from Merkl API
      const rewardData = await fetchMerklRewardsForAsset(
        tokenAddress,
        chainId,
        selectedAddress,
        abortController.signal,
      );

      if (!rewardData) {
        throw new Error('No claimable rewards found');
      }

      // Prepare claim parameters
      const users = [selectedAddress];
      const tokens = [rewardData.token.address];
      const amounts = [rewardData.amount];
      const proofs = [rewardData.proofs];

      // Encode the claim transaction data
      const contractInterface = new Interface(DISTRIBUTOR_CLAIM_ABI);
      const encodedData = contractInterface.encodeFunctionData('claim', [
        users,
        tokens,
        amounts,
        proofs,
      ]);

      const networkClientId = await findNetworkClientIdByChainId(claimChainId);

      const txParams = {
        from: selectedAddress as Hex,
        to: MERKL_DISTRIBUTOR_ADDRESS as Hex,
        value: '0x0' as Hex,
        data: encodedData as Hex,
        chainId: claimChainId,
      };

      // Create the transaction and navigate to confirmation page.
      await dispatch(
        addTransactionAndRouteToConfirmationPage(txParams, {
          networkClientId,
          type: TransactionType.musdClaim,
        }),
      );
    } catch (e) {
      const err = e as Error;

      // Ignore AbortError - component unmounted or request was cancelled
      if (err.name === 'AbortError') {
        return;
      }

      setError(err.message);
      setIsClaiming(false);
    }
  }, [selectedAddress, tokenAddress, chainId, claimChainId, dispatch]);

  return {
    claimRewards,
    isClaiming,
    error,
  };
};

/**
 * Check if a token is eligible for Merkl rewards.
 * Compares addresses case-insensitively since Ethereum addresses are case-insensitive.
 * Returns false for native tokens (undefined/null address).
 *
 * @param chainId - The chain ID of the token
 * @param address - The token's contract address
 * @returns Whether the token is eligible for Merkl rewards
 */
export const isEligibleForMerklRewards = (
  chainId: string,
  address: string | undefined | null,
): boolean => {
  if (!address) {
    return false;
  }
  const eligibleAddresses = ELIGIBLE_TOKENS[chainId];
  if (!eligibleAddresses) {
    return false;
  }
  const addressLower = address.toLowerCase();
  return eligibleAddresses.some(
    (eligibleAddress) => eligibleAddress.toLowerCase() === addressLower,
  );
};
