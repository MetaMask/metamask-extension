// Types mirror @nktkas/hyperliquid ApproveAgentTypes EXACTLY
// (node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/approveAgent.js):
// primary type "HyperliquidTransaction:ApproveAgent"; NO signatureChainId in the
// typed message (it lives only in the API action body); nonce is uint64.
// Any field/order/type drift from the SDK's ApproveAgentTypes fails the golden
// test in approve-agent-action.test.ts.

/**
 * EIP-712 domain used by every Hyperliquid user-signed action. Mirrors
 * `esm/signing/_userSigned.js`: chainId 42161 = 0xa4b1 (the signatureChainId)
 * and the zero verifyingContract.
 */
const HYPERLIQUID_SIGN_TRANSACTION_DOMAIN = {
  name: "HyperliquidSignTransaction",
  version: "1",
  chainId: 42161, // = 0xa4b1 (signatureChainId)
  verifyingContract: "0x0000000000000000000000000000000000000000",
} as const;

const APPROVE_AGENT_TYPES = {
  "HyperliquidTransaction:ApproveAgent": [
    { name: "hyperliquidChain", type: "string" },
    { name: "agentAddress", type: "address" },
    { name: "agentName", type: "string" },
    { name: "nonce", type: "uint64" },
  ],
} as const;

/**
 * Builds the EIP-712 typed data for the Hyperliquid `approveAgent` action.
 *
 * The returned `data` is passed verbatim as `msgParams.data` to
 * `KeyringController:signTypedMessage`; `expectedAddress` is the address that
 * must sign it (the agent being approved, as passed in by the caller).
 *
 * The payload is golden-tested against `@nktkas/hyperliquid`'s
 * `signUserSignedAction` + `ApproveAgentTypes`: identical inputs produce
 * byte-identical signatures. Keep this file in sync with the SDK's
 * `ApproveAgentTypes` when upgrading that dependency.
 *
 * @param params - The approveAgent parameters.
 * @param params.agentAddress - Address of the agent (API wallet) to approve.
 * @param params.agentName - Agent name (1-16 chars) or empty string for unnamed.
 * @param params.nonce - Timestamp in ms used to prevent replay attacks.
 * @param params.isTestnet - Whether the action targets Hyperliquid testnet.
 * @returns The typed data for `signTypedMessage` and the expected signer address.
 */
export function buildApproveAgentTypedData(params: {
  agentAddress: `0x${string}`;
  agentName: string;
  nonce: number;
  isTestnet: boolean;
}): { data: unknown; expectedAddress: string } {
  const { agentAddress, agentName, nonce, isTestnet } = params;
  return {
    data: {
      domain: HYPERLIQUID_SIGN_TRANSACTION_DOMAIN,
      types: APPROVE_AGENT_TYPES,
      primaryType: "HyperliquidTransaction:ApproveAgent",
      message: {
        hyperliquidChain: isTestnet ? "Testnet" : "Mainnet",
        agentAddress,
        agentName,
        nonce,
      },
    },
    expectedAddress: agentAddress,
  };
}
