/**
 * @jest-environment node
 */

import { execFileSync } from "child_process";
import path from "path";
import { Wallet } from "ethers";

import { buildApproveAgentTypedData } from "./approve-agent-action";

// Repo root, used to anchor the oracle subprocess's module resolution to this
// repository's node_modules (where @nktkas/hyperliquid is installed as a
// direct dependency).
const REPO_ROOT = path.join(__dirname, "..", "..", "..", "..", "..");

const TEST_PRIVATE_KEY = `0x${"11".repeat(32)}`;
const NONCE = 1_700_000_000_000;

/**
 * Oracle script executed in a plain Node child process.
 *
 * The SDK cannot be imported directly inside Jest: it is ESM-only and Jest 29
 * (CJS mode) patches `Module._extensions` process-wide, so even a native
 * `createRequire(...)` ends up routing the SDK's `export` statements through
 * Jest's CJS transform and throws `SyntaxError: Unexpected token 'export'`.
 * Running the genuine SDK in a subprocess keeps the oracle real (no reimplemented
 * signing logic) while staying compatible with the repo's Jest configuration.
 */
const SDK_ORACLE_SCRIPT = `
const { createRequire } = require('module');
const sdkRequire = createRequire(process.argv[1] + '/package.json');
const { signUserSignedAction } = sdkRequire('@nktkas/hyperliquid/signing');
const { ApproveAgentTypes } = sdkRequire('@nktkas/hyperliquid/api/exchange');
const { Wallet } = sdkRequire('ethers');
const params = JSON.parse(process.argv[2]);
const wallet = new Wallet(params.privateKey);
signUserSignedAction({
  wallet,
  action: {
    type: 'approveAgent',
    hyperliquidChain: params.isTestnet ? 'Testnet' : 'Mainnet',
    signatureChainId: '0xa4b1',
    agentAddress: params.agentAddress,
    agentName: params.agentName,
    nonce: params.nonce,
  },
  types: ApproveAgentTypes,
}).then((signature) => {
  console.log(JSON.stringify(signature));
});
`;

/**
 * Requests the SDK's signature for the given inputs via the subprocess oracle.
 * @param params
 * @param params.privateKey
 * @param params.agentAddress
 * @param params.agentName
 * @param params.nonce
 * @param params.isTestnet
 */
function signWithSdkOracle(params: {
  privateKey: string;
  agentAddress: string;
  agentName: string;
  nonce: number;
  isTestnet: boolean;
}): { r: string; s: string; v: number } {
  const stdout = execFileSync(
    process.execPath,
    ["-e", SDK_ORACLE_SCRIPT, REPO_ROOT, JSON.stringify(params)],
    { encoding: "utf8", timeout: 10_000 },
  );
  return JSON.parse(stdout.trim());
}

describe("buildApproveAgentTypedData", () => {
  it("produces the same signature as the SDK for identical inputs", async () => {
    const wallet = new Wallet(TEST_PRIVATE_KEY); // deterministic test key
    const params = {
      agentAddress: wallet.address.toLowerCase() as `0x${string}`,
      agentName: "metamask-perps",
      nonce: NONCE,
      isTestnet: false,
    };
    const { data } = buildApproveAgentTypedData(params);

    // Our path: ethers signs the typed data we built
    const ours = await wallet._signTypedData(
      (data as { domain: object }).domain as never,
      (data as { types: object }).types as never,
      (data as { message: object }).message as never,
    );

    // Oracle: SDK signs the same approveAgent action with its own ApproveAgentTypes
    const sdkSig = signWithSdkOracle({
      privateKey: TEST_PRIVATE_KEY,
      agentAddress: params.agentAddress,
      agentName: params.agentName,
      nonce: params.nonce,
      isTestnet: params.isTestnet,
    });
    const sdkSignature = `0x${sdkSig.r.slice(2)}${sdkSig.s.slice(2)}${sdkSig.v
      .toString(16)
      .padStart(2, "0")}`;

    expect(ours).toBe(sdkSignature);
  });

  it("targets the HyperliquidSignTransaction domain on Arbitrum One", () => {
    const { data } = buildApproveAgentTypedData({
      agentAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      agentName: "metamask-perps",
      nonce: NONCE,
      isTestnet: false,
    });
    const typedData = data as {
      domain: Record<string, unknown>;
      primaryType: string;
    };
    expect(typedData.domain).toStrictEqual({
      name: "HyperliquidSignTransaction",
      version: "1",
      chainId: 42161,
      verifyingContract: "0x0000000000000000000000000000000000000000",
    });
    expect(typedData.primaryType).toBe("HyperliquidTransaction:ApproveAgent");
  });

  it("selects the chain label and echoes the agent address per params", () => {
    const mainnet = buildApproveAgentTypedData({
      agentAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      agentName: "my-agent",
      nonce: NONCE,
      isTestnet: false,
    });
    const testnet = buildApproveAgentTypedData({
      agentAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      agentName: "my-agent",
      nonce: NONCE,
      isTestnet: true,
    });

    expect(
      (mainnet.data as { message: { hyperliquidChain: string } }).message.hyperliquidChain,
    ).toBe("Mainnet");
    expect(
      (testnet.data as { message: { hyperliquidChain: string } }).message.hyperliquidChain,
    ).toBe("Testnet");
    expect(mainnet.expectedAddress).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(testnet.expectedAddress).toBe("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  });
});
