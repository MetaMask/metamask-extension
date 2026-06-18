import { Buffer } from 'buffer';
import { BitcoinRegtestNode } from '../seeder/bitcoin/node';
import {
  SolanaNode,
  type SolanaValidatorPorts,
  resolveSolanaValidatorPorts,
} from '../seeder/solana/node';
import { getAvailablePorts, parsePortRange } from '../seeder/ports';
import { TronNode } from '../seeder/tron/node';

type ChainName = 'bitcoin' | 'solana' | 'tron';

type BitcoinBlockchainInfo = {
  blocks: number;
  chain: string;
};

type BitcoinRpcResponse<ResponseBody> = {
  error?: { message: string };
  result?: ResponseBody;
};

type TronBlockResponse = Partial<
  Record<
    'block_header',
    Partial<Record<'raw_data', { number?: number | string }>>
  >
>;

const CHAIN_NAMES = ['bitcoin', 'solana', 'tron'] as const;
async function main(): Promise<void> {
  const chainName = process.argv[2] ?? 'all';
  const chains =
    chainName === 'all' ? CHAIN_NAMES : [assertChainName(chainName)];

  for (const chain of chains) {
    if (chain === 'bitcoin') {
      await runBitcoinSmoke();
    } else if (chain === 'solana') {
      await runSolanaSmoke();
    } else {
      await runTronSmoke();
    }
  }
}

async function runBitcoinSmoke(): Promise<void> {
  const [firstRpcPort, secondRpcPort] = await getAvailablePortsWithGaps(2);
  const nodes = [new BitcoinRegtestNode(), new BitcoinRegtestNode()] as const;
  const ports = [
    { rpcPort: firstRpcPort },
    { rpcPort: secondRpcPort },
  ] as const;

  console.log(
    `Starting two Bitcoin regtest nodes on ${formatNodeUrls(
      ports.map(({ rpcPort }) => rpcPort),
    )}`,
  );

  try {
    await startAll(
      nodes.map(
        (node, index) => () =>
          node.start({ initialBalances: {}, ports: ports[index] }),
      ),
    );

    const infos = await Promise.all(
      nodes.map((node) =>
        requestBitcoinRpc<BitcoinBlockchainInfo>(
          node.baseUrl,
          'getblockchaininfo',
        ),
      ),
    );
    console.log(
      `Bitcoin smoke passed: ${infos
        .map(
          ({ chain, blocks }, index) => `node ${index + 1} ${chain}/${blocks}`,
        )
        .join(', ')}`,
    );
  } finally {
    await quitAll(nodes);
  }
}

async function runSolanaSmoke(): Promise<void> {
  const excludedPorts = new Set<number>();
  const ports = [
    await getSolanaValidatorPorts(excludedPorts),
    await getSolanaValidatorPorts(excludedPorts),
  ] as const;
  const nodes = [new SolanaNode(), new SolanaNode()] as const;

  console.log(
    `Starting two Solana validators on ${formatNodeUrls(
      ports.map(({ rpcPort }) => rpcPort),
    )}`,
  );

  try {
    await startAll(
      nodes.map((node, index) => () => node.start({ ports: ports[index] })),
    );

    const health = await Promise.all(
      nodes.map((node) => node.request<string>('getHealth')),
    );
    console.log(
      `Solana smoke passed: ${health
        .map((status, index) => `node ${index + 1} ${status}`)
        .join(', ')}`,
    );
  } finally {
    await quitAll(nodes);
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

async function getSolanaValidatorPorts(
  excludedPorts: Set<number>,
): Promise<SolanaValidatorPorts> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const [rpcPort] = await getAvailablePorts(1, excludedPorts);

    try {
      const ports = await resolveSolanaValidatorPorts({ rpcPort });
      const reservedPorts = getSolanaReservedPorts(ports);

      if (reservedPorts.some((port) => excludedPorts.has(port))) {
        excludedPorts.add(rpcPort);
        continue;
      }

      for (const port of reservedPorts) {
        excludedPorts.add(port);
      }
      return ports;
    } catch {
      excludedPorts.add(rpcPort);
    }
  }

  throw new Error('Unable to allocate two Solana validator port ranges');
}

function getSolanaReservedPorts(ports: SolanaValidatorPorts): number[] {
  const dynamicRange = parsePortRange(ports.dynamicPortRange);
  return [
    ports.rpcPort,
    ports.rpcPort + 1,
    ports.faucetPort,
    ports.gossipPort,
    ...Array.from(
      { length: dynamicRange.endPort - dynamicRange.startPort + 1 },
      (_, offset) => dynamicRange.startPort + offset,
    ),
  ];
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

async function requestBitcoinRpc<ResponseBody>(
  baseUrl: string,
  method: string,
): Promise<ResponseBody> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from('metamask:metamask').toString(
        'base64',
      )}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'local-node-port-smoke',
      jsonrpc: '1.0',
      method,
      params: [],
    }),
  });
  const json = (await response.json()) as BitcoinRpcResponse<ResponseBody>;

  if (!response.ok || json.error) {
    throw new Error(
      `Bitcoin RPC ${method} failed: ${
        json.error?.message ?? response.statusText
      }`,
    );
  }

  return json.result as ResponseBody;
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
