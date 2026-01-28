import type {
  WorkflowContext,
  BaseEnvironmentConfig,
  E2EEnvironmentConfig,
  ProdEnvironmentConfig,
} from '@metamask/metamask-extension-mcp';
import { MetaMaskBuildCapability } from './build';
import { MetaMaskFixtureCapability } from './fixture';
import { MetaMaskChainCapability, NoOpChainCapability } from './chain';
import { MetaMaskContractSeedingCapability } from './seeding';
import { MetaMaskStateSnapshotCapability } from './state-snapshot';

export type CreateMetaMaskContextOptions = {
  config?: Partial<E2EEnvironmentConfig>;
  ports?: {
    anvil?: number;
    fixtureServer?: number;
  };
  buildCommand?: string;
  buildOutputPath?: string;
  forkUrl?: string;
  forkBlockNumber?: number;
};

const DEFAULT_BASE_CONFIG: BaseEnvironmentConfig = {
  extensionName: 'MetaMask',
  defaultPassword: 'correct horse battery staple',
  toolPrefix: 'mm',
  artifactsDir: 'test-artifacts',
};

const DEFAULT_E2E_CONFIG: E2EEnvironmentConfig = {
  ...DEFAULT_BASE_CONFIG,
  environment: 'e2e',
  defaultChainId: 1337,
};

const DEFAULT_PROD_CONFIG: ProdEnvironmentConfig = {
  ...DEFAULT_BASE_CONFIG,
  environment: 'prod',
  defaultChainId: 1337,
};

export function createMetaMaskE2EContext(
  options: CreateMetaMaskContextOptions = {},
): WorkflowContext & { initializeSeeding: () => void } {
  const config: E2EEnvironmentConfig = {
    ...DEFAULT_E2E_CONFIG,
    ...options.config,
  };

  const build = new MetaMaskBuildCapability({
    command: options.buildCommand,
    outputPath: options.buildOutputPath,
  });

  const fixture = new MetaMaskFixtureCapability({
    port: options.ports?.fixtureServer,
  });

  const chain = new MetaMaskChainCapability({
    port: options.ports?.anvil,
    chainId: config.defaultChainId,
    forkUrl: options.forkUrl,
    forkBlockNumber: options.forkBlockNumber,
  });

  const contractSeeding = new MetaMaskContractSeedingCapability({
    chainCapability: chain,
  });

  const stateSnapshot = new MetaMaskStateSnapshotCapability({
    defaultChainId: config.defaultChainId,
  });

  return {
    build,
    fixture,
    chain,
    contractSeeding,
    stateSnapshot,
    config,
    initializeSeeding: () => contractSeeding.initialize(),
  };
}

export type RemoteChainConfig = {
  rpcUrl: string;
  chainId?: number;
};

export type CreateMetaMaskProdContextOptions = Omit<
  CreateMetaMaskContextOptions,
  'config'
> & {
  config?: Partial<ProdEnvironmentConfig>;
  includeBuild?: boolean;
  remoteChain?: RemoteChainConfig;
};

export function createMetaMaskProdContext(
  options: CreateMetaMaskProdContextOptions = {},
): WorkflowContext {
  const config: ProdEnvironmentConfig = {
    ...DEFAULT_PROD_CONFIG,
    ...options.config,
  };

  const stateSnapshot = new MetaMaskStateSnapshotCapability({
    defaultChainId: config.defaultChainId,
  });

  const build = options.includeBuild
    ? new MetaMaskBuildCapability({
        command: options.buildCommand,
        outputPath: options.buildOutputPath,
      })
    : undefined;

  const chain = options.remoteChain
    ? new NoOpChainCapability({
        rpcUrl: options.remoteChain.rpcUrl,
        chainId: options.remoteChain.chainId ?? 1,
      })
    : undefined;

  return {
    ...(build && { build }),
    ...(chain && { chain }),
    stateSnapshot,
    config,
  };
}
