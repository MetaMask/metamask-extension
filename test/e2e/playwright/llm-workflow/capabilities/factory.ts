import type {
  WorkflowContext,
  BaseEnvironmentConfig,
  E2EEnvironmentConfig,
  ProdEnvironmentConfig,
} from '@metamask/client-mcp-core';
import type { MockedEndpoint, Mockttp } from '../../../mock-e2e';
import { MetaMaskBuildCapability } from './build';
import { MetaMaskFixtureCapability } from './fixture';
import { MetaMaskChainCapability, NoOpChainCapability } from './chain';
import { MetaMaskContractSeedingCapability } from './seeding';
import { MetaMaskStateSnapshotCapability } from './state-snapshot';
import { MetaMaskMockServerCapability } from './mock-server';

export type CreateMetaMaskContextOptions = {
  config?: Partial<E2EEnvironmentConfig>;
  ports?: {
    anvil?: number;
    fixtureServer?: number;
  };
  mockServer?: {
    enabled?: boolean;
    port?: number;
    chainId?: number;
    ethConversionInUsd?: string;
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => Promise<void | MockedEndpoint[]>;
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
  defaultChainId: 1,
};

export function createMetaMaskE2EContext(
  options: CreateMetaMaskContextOptions = {},
): WorkflowContext {
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

  const mockServer = new MetaMaskMockServerCapability({
    enabled: options.mockServer?.enabled,
    port: options.mockServer?.port,
    chainId: options.mockServer?.chainId ?? config.defaultChainId,
    ethConversionInUsd: options.mockServer?.ethConversionInUsd,
    testSpecificMock: options.mockServer?.testSpecificMock,
  });

  return {
    build,
    fixture,
    chain,
    contractSeeding,
    stateSnapshot,
    mockServer,
    config,
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
