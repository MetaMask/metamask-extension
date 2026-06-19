// TODO(bitcoin-regtest-up PR): import { BitcoinRegtestNode } from '../seeder/bitcoin/node';
// TODO(solana-test-validator PR): import { SolanaNode, type SolanaValidatorPorts, resolveSolanaValidatorPorts } from '../seeder/solana/node';
import { getAvailablePorts } from '../seeder/ports';
// TODO(solana-test-validator PR): also import { parsePortRange } from '../seeder/ports' when Solana sections are restored
import { TronNode } from '../seeder/tron/node';

// TODO: re-add 'bitcoin' | 'solana' once their upstream PRs land
type ChainName = 'tron';

// TODO(bitcoin-regtest-up PR): type BitcoinBlockchainInfo = { blocks: number; chain: string };
// TODO(bitcoin-regtest-up PR): type BitcoinRpcResponse<ResponseBody> = { error?: { message: string }; result?: ResponseBody };

type TronBlockResponse = Partial<
  Record<
    'block_header',
    Partial<Record<'raw_data', { number?: number | string }>>
  >
>;

// TODO(bitcoin-regtest-up PR, solana-test-validator PR): re-add 'bitcoin' and 'solana' once their upstream PRs land
const CHAIN_NAMES = ['tron'] as const;
async function main(): Promise<void> {
  const chainName = process.argv[2] ?? 'all';
  const chains =
    chainName === 'all' ? CHAIN_NAMES : [assertChainName(chainName)];

  for (const chain of chains) {
    // TODO(bitcoin-regtest-up PR): if (chain === 'bitcoin') { await runBitcoinSmoke(); } else
    // TODO(solana-test-validator PR): if (chain === 'solana') { await runSolanaSmoke(); } else
    await runTronSmoke();
  }
}

// TODO(bitcoin-regtest-up PR): restore runBitcoinSmoke() once bitcoin/node exists on this branch
// async function runBitcoinSmoke(): Promise<void> { ... }

// TODO(solana-test-validator PR): restore runSolanaSmoke() once solana/node exists on this branch
// async function runSolanaSmoke(): Promise<void> { ... }

async function runTronSmoke(): Promise<void> {
  const [firstFullNodePort, secondFullNodePort] =
    await getAvailablePortsWithGaps(2);
  const ports = [
    { fullNodePort: firstFullNodePort },
    { fullNodePort: secondFullNodePort },
  ] as const;
  const nodes = [new TronNode(), new TronNode()] as const;

  console.log(
    `Starting two java-tron private networks on ${formatNodeUrls(
      ports.map(({ fullNodePort }) => fullNodePort),
    )}`,
  );

  try {
    await startAll(
      nodes.map((node, index) => () => node.start({ ports: ports[index] })),
    );

    const blocks = await Promise.all(
      nodes.map(
        (node) =>
          node.fetchJson('/wallet/getnowblock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          }) as Promise<TronBlockResponse>,
      ),
    );
    console.log(
      `Tron smoke passed: ${blocks
        .map(
          (block, index) =>
            `node ${index + 1} block ${
              block.block_header?.raw_data?.number ?? 'unknown'
            }`,
        )
        .join(', ')}`,
    );
  } finally {
    await quitAll(nodes);
  }
}

// TODO(solana-test-validator PR): restore getSolanaValidatorPorts() and getSolanaReservedPorts()
// once solana/node and solana/ports exist on this branch.

async function getAvailablePortsWithGaps(
  count: number,
  gapSize = 8,
): Promise<number[]> {
  const ports: number[] = [];
  const excludedPorts = new Set<number>();

  while (ports.length < count) {
    const [port] = await getAvailablePorts(1, excludedPorts);
    ports.push(port);

    for (let offset = -gapSize; offset <= gapSize; offset += 1) {
      const excludedPort = port + offset;
      if (excludedPort >= 1 && excludedPort <= 65_535) {
        excludedPorts.add(excludedPort);
      }
    }
  }

  return ports;
}

// TODO(bitcoin-regtest-up PR): restore requestBitcoinRpc() once bitcoin/node exists on this branch.

async function startAll(starts: (() => Promise<void>)[]): Promise<void> {
  for (const start of starts) {
    await start();
  }
}

async function quitAll(
  nodes: readonly { quit: () => Promise<void> }[],
): Promise<void> {
  const results = await Promise.allSettled(nodes.map((node) => node.quit()));
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failure) {
    throw failure.reason;
  }
}

function assertChainName(chainName: string): ChainName {
  if ((CHAIN_NAMES as readonly string[]).includes(chainName)) {
    return chainName as ChainName;
  }

  throw new Error(
    `Unknown chain "${chainName}". Expected one of: all, ${CHAIN_NAMES.join(
      ', ',
    )}`,
  );
}

function formatNodeUrls(ports: readonly number[]): string {
  return ports.map((port) => `127.0.0.1:${port}`).join(' and ');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
