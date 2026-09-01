import { buildApproveAgentTypedData } from './approve-agent-action';

const EXCHANGE_ENDPOINT = 'https://api.hyperliquid.xyz/exchange';

/** Thrown when the master signature is rejected or the password is wrong. */
export class AgentSetupRejectionError extends Error {}

/** Thrown when the exchange rejects the `approveAgent` submission. */
export class AgentSetupSubmissionError extends Error {}

function splitSignature(signature: string): { r: string; s: string; v: 27 | 28 } {
  const r = signature.slice(0, 66);
  // HyperLiquid's ApproveAgentRequest schema requires Hex(66) (0x + 64 chars)
  // for both r and s, same as r.
  const s = `0x${signature.slice(66, 130)}`;
  const rawV = parseInt(signature.slice(130, 132), 16);
  const v = (rawV < 27 ? rawV + 27 : rawV) as 27 | 28;
  return { r, s, v };
}

/**
 * Runs the full agent setup flow: verifies the wallet password, generates the
 * agent keypair ({@link beginSetup}), has the MASTER account sign the
 * Hyperliquid `approveAgent` EIP-712 typed data via the keyring, submits the
 * action to the exchange, and — on success — activates the agent via
 * {@link completeSetup}.
 *
 * Throws {@link AgentSetupRejectionError} when the password is wrong or the
 * master signature is rejected, and {@link AgentSetupSubmissionError} when the
 * exchange submission fails; any mid-flight setup is marked failed via
 * {@link failSetup}.
 *
 * (For hardware wallets, `KeyringController:signTypedMessage` is the same path
 * used by all perps signing today — the device prompt appears with the
 * extension-side review preceding it.)
 *
 * @param controller - The agent wallet controller (structural subset).
 * @param controller.beginSetup - Generates the agent keypair.
 * @param controller.completeSetup - Persists and activates the agent.
 * @param controller.failSetup - Marks an in-flight setup failed.
 * @param messenger - Messenger with `KeyringController:verifyPassword` and
 * `KeyringController:signTypedMessage` access.
 * @param messenger.call - The messenger call method.
 * @param opts - The setup options.
 * @param opts.masterAccountAddress - The master account the agent is created for.
 * @param opts.isTestnet - Whether the agent targets Hyperliquid testnet.
 * @param opts.password - The wallet password (gates encryption of the agent key).
 * @returns The activated agent address.
 */
export async function setupAgentWallet(
  controller: { beginSetup(m: string): Promise<{ address: `0x${string}` }>;
                completeSetup(m: string, r: object, password: string): void;
                failSetup(m: string, reason: string): void },
  // Method (not property) syntax keeps this assignable from the restricted
  // controller messengers, whose `call` accepts only their literal action
  // types and whose response union is not always a Promise (strictFunctionTypes
  // checks property function types strictly). Every call below is awaited.
  messenger: { call(a: string, ...args: unknown[]): unknown },
  opts: { masterAccountAddress: string; isTestnet: boolean; password: string },
): Promise<{ agentAddress: `0x${string}` }> {
  // Password gates encryption of the agent key; verify against the vault first.
  try {
    await messenger.call('KeyringController:verifyPassword', opts.password);
  } catch {
    throw new AgentSetupRejectionError('Incorrect password');
  }
  const handle = await controller.beginSetup(opts.masterAccountAddress);
  const agentName = 'metamask-perps';
  const nonce = Date.now();
  const { data } = buildApproveAgentTypedData({
    agentAddress: handle.address, agentName, nonce, isTestnet: opts.isTestnet,
  });
  let signature: string;
  try {
    signature = (await messenger.call('KeyringController:signTypedMessage',
      { from: opts.masterAccountAddress, data }, 'V4')) as string;
  } catch (err) {
    controller.failSetup(opts.masterAccountAddress, String(err));
    throw new AgentSetupRejectionError('Master signature rejected');
  }
  // HL API expects {r,s,v}, not a hex signature string
  const { r, s, v } = splitSignature(signature);
  const body = JSON.stringify({
    action: { type: 'approveAgent', hyperliquidChain: opts.isTestnet ? 'Testnet' : 'Mainnet',
              signatureChainId: '0xa4b1', agentAddress: handle.address, agentName, nonce },
    nonce, signature: { r, s, v },
  });
  // Network/transport failures must not leave the setup stuck mid-flight.
  let json: { status?: string };
  let ok: boolean;
  try {
    const res = await fetch(EXCHANGE_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    ok = res.ok;
    json = (await res.json()) as { status?: string };
  } catch (err) {
    controller.failSetup(opts.masterAccountAddress, `submission failed: ${String(err)}`);
    throw new AgentSetupSubmissionError(`submission failed: ${String(err)}`);
  }
  if (!ok || json.status === 'err') {
    controller.failSetup(opts.masterAccountAddress, `submission failed: ${JSON.stringify(json)}`);
    throw new AgentSetupSubmissionError(JSON.stringify(json));
  }
  await controller.completeSetup(opts.masterAccountAddress, {
    agentAddress: handle.address, agentName,
    masterAccountAddress: opts.masterAccountAddress, createdAt: Date.now(),
  }, opts.password);
  return { agentAddress: handle.address };
}
