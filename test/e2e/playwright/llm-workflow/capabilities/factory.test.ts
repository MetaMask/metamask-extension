import { createMetaMaskE2EContext, createMetaMaskProdContext } from './factory';
import { MetaMaskBuildCapability } from './build';
import { MetaMaskFixtureCapability } from './fixture';
import { MetaMaskChainCapability, NoOpChainCapability } from './chain';
import { MetaMaskContractSeedingCapability } from './seeding';
import { MetaMaskStateSnapshotCapability } from './state-snapshot';
import { MetaMaskMockServerCapability } from './mock-server';

describe('Capability Factory', () => {
  describe('createMetaMaskE2EContext', () => {
    it('creates context with all E2E capabilities', () => {
      const context = createMetaMaskE2EContext();

      expect(context.build).toBeInstanceOf(MetaMaskBuildCapability);
      expect(context.fixture).toBeInstanceOf(MetaMaskFixtureCapability);
      expect(context.chain).toBeInstanceOf(MetaMaskChainCapability);
      expect(context.contractSeeding).toBeInstanceOf(
        MetaMaskContractSeedingCapability,
      );
      expect(context.stateSnapshot).toBeInstanceOf(
        MetaMaskStateSnapshotCapability,
      );
      expect(context.mockServer).toBeInstanceOf(MetaMaskMockServerCapability);
    });

    it('creates config with E2E environment', () => {
      const context = createMetaMaskE2EContext();

      expect(context.config.environment).toBe('e2e');
      expect(context.config.extensionName).toBe('MetaMask');
      expect(context.config.toolPrefix).toBe('mm');
    });

    it('uses default password', () => {
      const context = createMetaMaskE2EContext();

      expect(context.config.defaultPassword).toBe(
        'correct horse battery staple',
      );
    });

    it('uses default chain ID', () => {
      const context = createMetaMaskE2EContext();

      expect(context.config.defaultChainId).toBe(1337);
    });

    it('uses custom ports when provided', () => {
      const context = createMetaMaskE2EContext({
        ports: {
          anvil: 9545,
          fixtureServer: 23456,
        },
      });

      expect(context.chain).toBeInstanceOf(MetaMaskChainCapability);
      expect(context.fixture).toBeInstanceOf(MetaMaskFixtureCapability);
    });

    it('uses custom build command when provided', () => {
      const context = createMetaMaskE2EContext({
        buildCommand: 'yarn build:flask',
      });

      expect(context.build).toBeDefined();
    });

    it('merges custom config with defaults', () => {
      const context = createMetaMaskE2EContext({
        config: {
          extensionName: 'CustomWallet',
          toolPrefix: 'cw',
        },
      });

      expect(context.config.extensionName).toBe('CustomWallet');
      expect(context.config.toolPrefix).toBe('cw');
      expect(context.config.environment).toBe('e2e');
    });
  });

  describe('createMetaMaskProdContext', () => {
    it('creates context with limited capabilities', () => {
      const context = createMetaMaskProdContext();

      expect(context.stateSnapshot).toBeInstanceOf(
        MetaMaskStateSnapshotCapability,
      );
    });

    it('does not include E2E-specific capabilities', () => {
      const context = createMetaMaskProdContext();

      expect(context.fixture).toBeUndefined();
      expect(context.chain).toBeUndefined();
      expect(context.contractSeeding).toBeUndefined();
      expect((context as { mockServer?: unknown }).mockServer).toBeUndefined();
    });

    it('creates config with prod environment', () => {
      const context = createMetaMaskProdContext();

      expect(context.config.environment).toBe('prod');
      expect(context.config.extensionName).toBe('MetaMask');
    });

    it('uses default password', () => {
      const context = createMetaMaskProdContext();

      expect(context.config.defaultPassword).toBe(
        'correct horse battery staple',
      );
    });

    it('merges custom config with defaults', () => {
      const context = createMetaMaskProdContext({
        config: {
          defaultPassword: 'custom-password',
        },
      });

      expect(context.config.defaultPassword).toBe('custom-password');
      expect(context.config.environment).toBe('prod');
    });

    describe('Phase 3 prod-mode behavior', () => {
      it('excludes fixture capability by default', () => {
        const context = createMetaMaskProdContext();

        expect(context.fixture).toBeUndefined();
      });

      it('excludes chain capability by default', () => {
        const context = createMetaMaskProdContext();

        expect(context.chain).toBeUndefined();
      });

      it('excludes contractSeeding capability by default', () => {
        const context = createMetaMaskProdContext();

        expect(context.contractSeeding).toBeUndefined();
      });

      it('includes stateSnapshot capability by default', () => {
        const context = createMetaMaskProdContext();

        expect(context.stateSnapshot).toBeInstanceOf(
          MetaMaskStateSnapshotCapability,
        );
      });

      it('excludes build capability by default', () => {
        const context = createMetaMaskProdContext();

        expect(context.build).toBeUndefined();
      });

      it('includes build capability when includeBuild is true', () => {
        const context = createMetaMaskProdContext({
          includeBuild: true,
        });

        expect(context.build).toBeInstanceOf(MetaMaskBuildCapability);
      });

      it('excludes build capability when includeBuild is false', () => {
        const context = createMetaMaskProdContext({
          includeBuild: false,
        });

        expect(context.build).toBeUndefined();
      });

      it('excludes chain capability when remoteChain is not provided', () => {
        const context = createMetaMaskProdContext();

        expect(context.chain).toBeUndefined();
      });

      it('includes NoOpChainCapability when remoteChain config is provided', () => {
        const context = createMetaMaskProdContext({
          remoteChain: {
            rpcUrl: 'https://mainnet.infura.io/v3/test-key',
          },
        });

        expect(context.chain).toBeInstanceOf(NoOpChainCapability);
      });

      it('configures NoOpChainCapability with provided rpcUrl', () => {
        const rpcUrl = 'https://mainnet.infura.io/v3/test-key';
        const context = createMetaMaskProdContext({
          remoteChain: { rpcUrl },
        });

        expect(context.chain).toBeInstanceOf(NoOpChainCapability);
      });

      it('configures NoOpChainCapability with provided chainId', () => {
        const context = createMetaMaskProdContext({
          remoteChain: {
            rpcUrl: 'https://mainnet.infura.io/v3/test-key',
            chainId: 1,
          },
        });

        expect(context.chain).toBeInstanceOf(NoOpChainCapability);
      });

      it('creates NoOpChainCapability when remoteChain.chainId is not provided', () => {
        const context = createMetaMaskProdContext({
          remoteChain: {
            rpcUrl: 'https://mainnet.infura.io/v3/test-key',
          },
        });

        expect(context.chain).toBeInstanceOf(NoOpChainCapability);
      });

      it('includes both build and chain when both options are provided', () => {
        const context = createMetaMaskProdContext({
          includeBuild: true,
          remoteChain: {
            rpcUrl: 'https://mainnet.infura.io/v3/test-key',
            chainId: 1,
          },
        });

        expect(context.build).toBeInstanceOf(MetaMaskBuildCapability);
        expect(context.chain).toBeInstanceOf(NoOpChainCapability);
        expect(context.stateSnapshot).toBeInstanceOf(
          MetaMaskStateSnapshotCapability,
        );
      });
    });
  });
});
