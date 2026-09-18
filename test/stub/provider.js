import {
  JsonRpcEngine,
  createScaffoldMiddleware,
} from '@metamask/json-rpc-engine';
import { InternalProvider } from '@metamask/eth-json-rpc-provider';
import { CHAIN_IDS } from '../../shared/constants/network';

const ZERO_HASH = `0x${'0'.repeat(64)}`;
const ZERO_BLOOM = `0x${'0'.repeat(512)}`;
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

const defaultBlock = {
  number: '0x1',
  hash: ZERO_HASH,
  parentHash: ZERO_HASH,
  nonce: '0x0000000000000000',
  sha3Uncles: ZERO_HASH,
  logsBloom: ZERO_BLOOM,
  transactionsRoot: ZERO_HASH,
  stateRoot: ZERO_HASH,
  receiptsRoot: ZERO_HASH,
  miner: ZERO_ADDRESS,
  difficulty: '0x0',
  totalDifficulty: '0x0',
  extraData: '0x',
  size: '0x0',
  gasLimit: '0x0',
  gasUsed: '0x0',
  timestamp: '0x0',
  transactions: [],
  uncles: [],
};

export function getTestSeed() {
  return 'people carpet cluster attract ankle motor ozone mass dove original primary mask';
}

export function getTestAccounts() {
  return [
    {
      address: '0x88bb7F89eB5e5b30D3e15a57C68DBe03C6aCCB21',
      key: Buffer.from(
        '254A8D551474F35CCC816388B4ED4D20B945C96B7EB857A68064CB9E9FB2C092',
        'hex',
      ),
    },
    {
      address: '0x1fe9aAB565Be19629fF4e8541ca2102fb42D7724',
      key: Buffer.from(
        '6BAB5A4F2A6911AF8EE2BD32C6C05F6643AC48EF6C939CDEAAAE6B1620805A9B',
        'hex',
      ),
    },
    {
      address: '0xbda5c89aa6bA1b352194291AD6822C92AbC87c7B',
      key: Buffer.from(
        '9B11D7F833648F26CE94D544855558D7053ECD396E4F4563968C232C012879B0',
        'hex',
      ),
    },
  ];
}

export function createEngineForTestData() {
  return new JsonRpcEngine();
}

export function createTestProviderTools(opts = {}) {
  const chainId = opts.chainId ?? CHAIN_IDS.MAINNET;
  const networkId = String(opts.networkId ?? 1);

  const engine = createEngineForTestData();
  // Caller-provided overrides take precedence.
  engine.push(createScaffoldMiddleware(opts.scaffold ?? {}));
  // Sensible defaults for any RPC methods the tests don't explicitly stub.
  // These let consumers exercise contract/network logic without spinning up a
  // local EVM node.
  engine.push(
    createScaffoldMiddleware({
      eth_chainId: chainId,
      net_version: networkId,
      eth_blockNumber: '0x1',
      eth_gasPrice: '0x1',
      eth_getBalance: '0x0',
      eth_getCode: '0x',
      eth_call: '0x',
      eth_getBlockByNumber: defaultBlock,
      eth_getBlockByHash: defaultBlock,
      eth_accounts: [],
      net_listening: true,
      web3_clientVersion: 'metamask-test-stub/0.0.0',
    }),
  );
  // Final fallback so unhandled methods fail loudly rather than hanging.
  engine.push((req, _res, _next, end) => {
    end(
      new Error(
        `createTestProviderTools: unhandled JSON-RPC method "${req.method}". Add it to the test scaffold.`,
      ),
    );
  });

  const provider = new InternalProvider({ engine });
  return { provider, engine };
}
