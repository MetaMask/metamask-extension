import type { QuoteResponse, QuoteMetadata } from '@metamask/bridge-controller';
import type { HardwareWalletSignaturesState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { HardwareWalletSignatureEvent } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

export type LockedQuote = (QuoteResponse & QuoteMetadata) | null | undefined;

export type HardwareWalletSignatureAction = {
  type: typeof HardwareWalletSignatureEvent.Reset;
  needsTwoConfirmations: boolean;
};

export type UseHwSwapSubmissionOptions = {
  lockedQuote: LockedQuote;
  needsTwoConfirmations: boolean;
  signatureState: HardwareWalletSignaturesState;
  dispatchSignatureEvent: React.Dispatch<HardwareWalletSignatureAction>;
  submitBridgeTransaction: (
    quote: QuoteResponse & QuoteMetadata,
    options?: { rpcTimeoutMs?: number },
  ) => Promise<void>;
};
