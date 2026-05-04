import { toolRegistry } from '@metamask/client-mcp-core';
import type { ToolContext, WorkflowContext } from '@metamask/client-mcp-core';
import { metaMaskSessionManager as sessionManager } from '../metamask-provider';
import { createMetaMaskE2EContext, createMetaMaskProdContext } from './factory';

describe('Capability Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WorkflowContext initialization', () => {
    it('creates a context with all MetaMask capabilities', () => {
      const context = createMetaMaskE2EContext();

      expect(context.fixture).toBeDefined();
      expect(context.chain).toBeDefined();
      expect(context.contractSeeding).toBeDefined();
      expect(context.stateSnapshot).toBeDefined();
      expect(context.mockServer).toBeDefined();
      expect(context.config).toBeDefined();
    });

    it('provides correct config values', () => {
      const context = createMetaMaskE2EContext();

      expect(context.config.extensionName).toBe('MetaMask');
      expect(context.config.environment).toBe('e2e');
    });
  });

  describe('SessionManager context injection', () => {
    afterEach(() => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );
    });

    it('stores WorkflowContext when setWorkflowContext is called', () => {
      const context = createMetaMaskE2EContext();
      sessionManager.setWorkflowContext(context as unknown as WorkflowContext);

      expect(sessionManager.getWorkflowContext()).toBe(context);
    });

    it('provides access to individual capabilities via getter methods', () => {
      const context = createMetaMaskE2EContext();
      sessionManager.setWorkflowContext(context as unknown as WorkflowContext);

      expect(sessionManager.getFixtureCapability()).toBe(context.fixture);
      expect(sessionManager.getChainCapability()).toBe(context.chain);
      expect(sessionManager.getContractSeedingCapability()).toBe(
        context.contractSeeding,
      );
      expect(sessionManager.getStateSnapshotCapability()).toBe(
        context.stateSnapshot,
      );
    });

    it('returns undefined when no context is set', () => {
      expect(sessionManager.getFixtureCapability()).toBeUndefined();
      expect(sessionManager.getChainCapability()).toBeUndefined();
      expect(sessionManager.getContractSeedingCapability()).toBeUndefined();
      expect(sessionManager.getStateSnapshotCapability()).toBeUndefined();
    });
  });

  describe('Tool registry', () => {
    it('provides handlers for all core tools', () => {
      const expectedTools = [
        // build is registered by @metamask/client-mcp-core and will be used
        // for mobile client support. No MetaMask Extension implementation needed.
        'build',
        'launch',
        'cleanup',
        'get_state',
        'navigate',
        'wait_for_notification',
        'switch_to_tab',
        'close_tab',
        'list_testids',
        'accessibility_snapshot',
        'describe_screen',
        'screenshot',
        'click',
        'type',
        'wait_for',
        'knowledge_last',
        'knowledge_search',
        'knowledge_summarize',
        'knowledge_sessions',
        'seed_contract',
        'seed_contracts',
        'get_contract_address',
        'list_contracts',
        'run_steps',
        'set_context',
        'get_context',
      ];

      for (const toolName of expectedTools) {
        expect(toolRegistry.has(toolName)).toBe(true);
        expect(toolRegistry.get(toolName)).toBeDefined();
      }
    });

    it('returns undefined for unknown tools', () => {
      expect(toolRegistry.has('unknown_tool')).toBe(false);
      expect(toolRegistry.get('unknown_tool')).toBeUndefined();
    });
  });

  describe('Backward compatibility', () => {
    it('tools work even when context is not set (legacy mode)', async () => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );

      const handler = toolRegistry.get('knowledge_sessions');
      expect(handler).toBeDefined();
      if (!handler) {
        throw new Error('Handler not found');
      }

      const result = await handler({ limit: 5 }, {} as ToolContext);

      expect(result).toBeDefined();
      expect(typeof result.ok).toBe('boolean');
    });

    it('context-dependent tools handle missing capabilities gracefully', async () => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );

      expect(sessionManager.getStateSnapshotCapability()).toBeUndefined();
    });
  });

  describe('Prod-mode session manager behavior', () => {
    beforeEach(() => {
      const prodContext = createMetaMaskProdContext();
      sessionManager.setWorkflowContext(
        prodContext as unknown as WorkflowContext,
      );
    });

    afterEach(() => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );
    });

    it('prod context excludes fixture capability', () => {
      expect(sessionManager.getFixtureCapability()).toBeUndefined();
    });

    it('prod context excludes chain capability by default', () => {
      expect(sessionManager.getChainCapability()).toBeUndefined();
    });

    it('prod context excludes contractSeeding capability', () => {
      expect(sessionManager.getContractSeedingCapability()).toBeUndefined();
    });

    it('prod context includes stateSnapshot capability', () => {
      expect(sessionManager.getStateSnapshotCapability()).toBeDefined();
    });

    it('prod context excludes build capability by default', () => {
      expect(sessionManager.getBuildCapability()).toBeUndefined();
    });

    it('prod context reports environment as prod', () => {
      const context = sessionManager.getWorkflowContext();
      expect(context?.config?.environment).toBe('prod');
    });

    describe('with remoteChain option', () => {
      beforeEach(() => {
        const prodContext = createMetaMaskProdContext({
          remoteChain: {
            rpcUrl: 'https://mainnet.infura.io/v3/test-key',
            chainId: 1,
          },
        });
        sessionManager.setWorkflowContext(
          prodContext as unknown as WorkflowContext,
        );
      });

      it('includes chain capability when remoteChain is provided', () => {
        expect(sessionManager.getChainCapability()).toBeDefined();
      });

      it('chain capability is a NoOpChainCapability instance', () => {
        const chain = sessionManager.getChainCapability();
        expect(chain).toBeDefined();
        expect(chain?.isRunning()).toBe(true);
      });
    });
  });

  describe('Prod-mode launch input validation', () => {
    beforeEach(() => {
      const prodContext = createMetaMaskProdContext();
      sessionManager.setWorkflowContext(
        prodContext as unknown as WorkflowContext,
      );
    });

    afterEach(async () => {
      if (sessionManager.hasActiveSession()) {
        await sessionManager.cleanup();
      }
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );
    });

    it('rejects fixturePreset input in prod mode', async () => {
      await expect(
        sessionManager.launch({
          fixturePreset: 'withMultipleAccounts',
          stateMode: 'custom',
        }),
      ).rejects.toThrow(
        'Fixture options (fixturePreset, fixture) are not available in prod mode',
      );
    });

    it('rejects fixture input in prod mode', async () => {
      await expect(
        sessionManager.launch({
          fixture: { someFixtureData: true },
          stateMode: 'custom',
        }),
      ).rejects.toThrow(
        'Fixture options (fixturePreset, fixture) are not available in prod mode',
      );
    });

    it('provides helpful error message with alternatives', async () => {
      try {
        await sessionManager.launch({
          fixturePreset: 'withMultipleAccounts',
          stateMode: 'custom',
        });
        throw new Error('Expected launch to throw');
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain(
          'Remove fixturePreset/fixture parameters',
        );
        expect(errorMessage).toContain('stateMode: "onboarding"');
        expect(errorMessage).toContain('Switch to e2e environment');
      }
    });
  });
});
