// ponytail: local POC toggle for the "offload transaction tracking to the client"
// migration (Alternative B). When true, activity-v2 sources non-EVM history from
// the Accounts API (instead of snap-fed controller state) and treats controller
// state purely as the pending overlay. Chain-agnostic: Solana is just the first
// chain exercised. Production wires this to the remote feature flag (ticket 3),
// per chain.
export const NON_EVM_ACTIVITY_FROM_API = true;
