import type { WorkflowContext } from '@metamask/client-mcp-core';
import { metaMaskSessionManager } from '../metamask-provider';
import { createMetaMaskE2EContext, createMetaMaskProdContext } from './factory';
import { MetaMaskFixtureCapability } from './fixture';
import { MetaMaskChainCapability, NoOpChainCapability } from './chain';
import { MetaMaskContractSeedingCapability } from './seeding';
import { MetaMaskStateSnapshotCapability } from './state-snapshot';
import { MetaMaskMockServerCapability } from './mock-server';

describe('Capability Factory', () => {
  describe('createMetaMaskE2EContext', () => {
    it('creates context with all E2E capabilities', () => {
      const context = createMetaMaskE2EContext();

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

    it('keeps mock server disabled by default', () => {
      const context = createMetaMaskE2EContext();
      const mockServerCapability = context.mockServer as unknown as {
        enabled: boolean;
      };

      expect(mockServerCapability.enabled).toBe(false);
    });

    it('enables mock server when e2e mockServer.enabled is true', () => {
      const context = createMetaMaskE2EContext({
        mockServer: {
          enabled: true,
          port: 18000,
        },
      });
      const mockServerCapability = context.mockServer as unknown as {
        enabled: boolean;
        port: number | undefined;
      };

      expect(mockServerCapability.enabled).toBe(true);
      expect(mockServerCapability.port).toBe(18000);
    });

    it('creates config with E2E environment', () => {
      const context = createMetaMaskE2EContext();

      expect(context.config.environment).toBe('e2e');
      expect(context.config.extensionName).toBe('MetaMask');
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

    it('uses custom ports when provided via config', () => {
      const context = createMetaMaskE2EContext({
        config: {
          ports: {
            anvil: 9545,
            fixtureServer: 23456,
          },
        },
      });

      expect(context.chain).toBeInstanceOf(MetaMaskChainCapability);
      expect(context.fixture).toBeInstanceOf(MetaMaskFixtureCapability);
    });

    it('wires ports from config into capabilities', () => {
      const context = createMetaMaskE2EContext({
        config: {
          ports: {
            anvil: 9545,
            fixtureServer: 23456,
          },
        },
      });

      const chain = context.chain as unknown as { port: number };
      const fixture = context.fixture as unknown as { port: number };

      expect(chain.port).toBe(9545);
      expect(fixture.port).toBe(23456);
    });

    it('stores ports in config.ports for downstream consumers', () => {
      const context = createMetaMaskE2EContext({
        config: {
          ports: {
            anvil: 9545,
            fixtureServer: 23456,
          },
        },
      });

      const e2eConfig = context.config as { ports?: Record<string, number> };
      expect(e2eConfig.ports?.anvil).toBe(9545);
      expect(e2eConfig.ports?.fixtureServer).toBe(23456);
    });

    it('keeps config.ports and capability ports in sync', () => {
      const context = createMetaMaskE2EContext({
        config: {
          ports: {
            anvil: 7777,
            fixtureServer: 8888,
          },
        },
      });

      const chain = context.chain as unknown as { port: number };
      const fixture = context.fixture as unknown as { port: number };
      const e2eConfig = context.config as { ports?: Record<string, number> };

      expect(chain.port).toBe(e2eConfig.ports?.anvil);
      expect(fixture.port).toBe(e2eConfig.ports?.fixtureServer);
    });

    it('merges custom config with defaults', () => {
      const context = createMetaMaskE2EContext({
        config: {
          extensionName: 'CustomWallet',
        },
      });

      expect(context.config.extensionName).toBe('CustomWallet');
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

      it('includes chain when remoteChain option is provided', () => {
        const context = createMetaMaskProdContext({
          remoteChain: {
            rpcUrl: 'https://mainnet.infura.io/v3/test-key',
            chainId: 1,
          },
        });

        expect(context.chain).toBeInstanceOf(NoOpChainCapability);
        expect(context.stateSnapshot).toBeInstanceOf(
          MetaMaskStateSnapshotCapability,
        );
      });
    });
  });

  describe('MetaMaskSessionManager context switching', () => {
    beforeEach(() => {
      metaMaskSessionManager.setWorkflowContext(
        createMetaMaskE2EContext() as WorkflowContext,
      );
    });

    afterEach(() => {
      metaMaskSessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );
    });

    describe('setContext', () => {
      it('switches from e2e to prod context successfully', () => {
        expect(metaMaskSessionManager.getEnvironmentMode()).toBe('e2e');
        metaMaskSessionManager.setContext('prod');
        expect(metaMaskSessionManager.getEnvironmentMode()).toBe('prod');
      });

      it('is no-op when switching to same context', () => {
        metaMaskSessionManager.setContext('e2e');
        expect(metaMaskSessionManager.getEnvironmentMode()).toBe('e2e');
      });

      it('rebuilds same context when options are provided', () => {
        const originalContext = metaMaskSessionManager.getWorkflowContext();

        metaMaskSessionManager.setContext('e2e', {
          mockServer: {
            enabled: true,
            port: 18000,
          },
        });

        const updatedContext = metaMaskSessionManager.getWorkflowContext();
        const mockServerCapability = updatedContext?.mockServer as unknown as {
          enabled: boolean;
          port: number | undefined;
        };

        expect(updatedContext).not.toBe(originalContext);
        expect(mockServerCapability.enabled).toBe(true);
        expect(mockServerCapability.port).toBe(18000);
      });

      it('passes prod context options when switching to prod', () => {
        metaMaskSessionManager.setContext('prod', {
          remoteChain: {
            rpcUrl: 'https://mainnet.infura.io/v3/test-key',
            chainId: 1,
          },
        });

        const context = metaMaskSessionManager.getWorkflowContext();

        expect(context?.config.environment).toBe('prod');
        expect(context?.chain).toBeInstanceOf(NoOpChainCapability);
      });

      it('throws MM_CONTEXT_SWITCH_BLOCKED when session is active', () => {
        const hasActiveSessionSpy = jest
          .spyOn(metaMaskSessionManager, 'hasActiveSession')
          .mockReturnValue(true);
        const getSessionIdSpy = jest
          .spyOn(metaMaskSessionManager, 'getSessionId')
          .mockReturnValue('test-session-123');

        expect(() => metaMaskSessionManager.setContext('prod')).toThrow(
          'MM_CONTEXT_SWITCH_BLOCKED',
        );

        hasActiveSessionSpy.mockRestore();
        getSessionIdSpy.mockRestore();
      });

      it('creates new context instance on switch', () => {
        const originalContext = metaMaskSessionManager.getWorkflowContext();
        metaMaskSessionManager.setContext('prod');
        metaMaskSessionManager.setContext('e2e');
        const newContext = metaMaskSessionManager.getWorkflowContext();
        expect(newContext).not.toBe(originalContext);
      });
    });

    describe('getContextInfo', () => {
      it('returns correct info for e2e context', () => {
        const info = metaMaskSessionManager.getContextInfo();
        expect(info.currentContext).toBe('e2e');
        expect(info.capabilities.available).not.toContain('build');
      });

      it('returns canSwitchContext=false when session active', () => {
        const spy = jest
          .spyOn(metaMaskSessionManager, 'hasActiveSession')
          .mockReturnValue(true);
        const info = metaMaskSessionManager.getContextInfo();
        expect(info.canSwitchContext).toBe(false);
        spy.mockRestore();
      });

      it('returns canSwitchContext=true when no session', () => {
        const spy = jest
          .spyOn(metaMaskSessionManager, 'hasActiveSession')
          .mockReturnValue(false);
        const info = metaMaskSessionManager.getContextInfo();
        expect(info.canSwitchContext).toBe(true);
        spy.mockRestore();
      });
    });
  });
});
