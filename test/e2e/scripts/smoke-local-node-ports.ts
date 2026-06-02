import { getAvailablePorts } from '../seeder/ports';
import { TronNode } from '../seeder/tron/node';

type ChainName = 'bitcoin' | 'solana' | 'tron';

type TronBlockResponse = Partial<
  Record<
    'block_header',
    Partial<Record<'raw_data', { number?: number | string }>>
  >
>;

const CHAIN_NAMES = ['tron'] as const;
async function main(): Promise<void> {
  const chainName = process.argv[2] ?? 'all';
  const chains =
    chainName === 'all' ? CHAIN_NAMES : [assertChainName(chainName)];

  for (const chain of chains) {
    if (chain === 'tron') {
      await runTronSmoke();
    } else {
      throw new Error(`Invalid chain ${chain}`);
    }
  }
}

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
