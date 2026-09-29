import { TransactionMeta } from '@metamask/transaction-controller';
import { getIsGasFeeSponsored } from '../../../../../shared/lib/gas-sponsorship';
import { useConfirmContext } from '../../context/confirm';
import { useGasSponsorshipPreference } from './useGasSponsorshipPreference';
import { useIsGaslessSupported } from './useIsGaslessSupported';

/**
 * Whether MetaMask sponsors the gas fee of the current confirmation.
 *
 * Applies the same {@link getIsGasFeeSponsored} rules as the background
 * sponsorship function used by the publish hook and Transaction Pay, so the
 * confirmation shows the fee as sponsored only when it will be published as
 * sponsored.
 *
 * @returns An object containing:
 * - `isGasFeeSponsored`: Whether the gas fee is sponsored.
 * - `isGasFeeSponsorshipEligible`: Whether the gas fee would be sponsored if
 * the user had not opted out, so the user can opt back in.
 * - `pending`: Whether the gasless support checks are still in progress.
 */
export function useIsGasFeeSponsored(): {
  isGasFeeSponsored: boolean;
  isGasFeeSponsorshipEligible: boolean;
  pending: boolean;
} {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { isSponsorshipOptedOut } = useGasSponsorshipPreference(
    transactionMeta?.chainId,
  );

  const { isSupported: isGaslessSupported, pending } = useIsGaslessSupported();

  const isGasFeeSponsorshipEligible = getIsGasFeeSponsored(transactionMeta, {
    isGaslessSupported,
    isOptedOut: false,
  });

  return {
    isGasFeeSponsored: isGasFeeSponsorshipEligible && !isSponsorshipOptedOut,
    isGasFeeSponsorshipEligible,
    pending,
  };
}
