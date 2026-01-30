/* eslint-disable import/extensions */
import {
  getToolHandler,
  hasToolHandler,
  setSessionManager,
} from '@metamask/client-mcp-core';
/* eslint-enable import/extensions */
import type { WorkflowContext } from '@metamask/client-mcp-core';
import { metaMaskSessionManager as sessionManager } from '../mcp-server/metamask-provider';
import { createMetaMaskE2EContext, createMetaMaskProdContext } from './factory';

describe('Capability Integration', () => {
  beforeAll(() => {
    setSessionManager(sessionManager);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WorkflowContext initialization', () => {
    it('creates a context with all MetaMask capabilities', () => {
      const context = createMetaMaskE2EContext();

      expect(context.build).toBeDefined();
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
      expect(context.config.toolPrefix).toBe('mm');
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

      expect(sessionManager.getBuildCapability()).toBe(context.build);
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
      expect(sessionManager.getBuildCapability()).toBeUndefined();
      expect(sessionManager.getFixtureCapability()).toBeUndefined();
      expect(sessionManager.getChainCapability()).toBeUndefined();
      expect(sessionManager.getContractSeedingCapability()).toBeUndefined();
      expect(sessionManager.getStateSnapshotCapability()).toBeUndefined();
    });
  });

  describe('Tool registry', () => {
    it('provides handlers for all mm_* tools', () => {
      const expectedTools = [
        'mm_build',
        'mm_launch',
        'mm_cleanup',
        'mm_get_state',
        'mm_navigate',
        'mm_wait_for_notification',
        'mm_switch_to_tab',
        'mm_close_tab',
        'mm_list_testids',
        'mm_accessibility_snapshot',
        'mm_describe_screen',
        'mm_screenshot',
        'mm_click',
        'mm_type',
        'mm_wait_for',
        'mm_knowledge_last',
        'mm_knowledge_search',
        'mm_knowledge_summarize',
        'mm_knowledge_sessions',
        'mm_seed_contract',
        'mm_seed_contracts',
        'mm_get_contract_address',
        'mm_list_contracts',
        'mm_run_steps',
        'mm_set_context',
        'mm_get_context',
      ];

      for (const toolName of expectedTools) {
        expect(hasToolHandler(toolName)).toBe(true);
        expect(getToolHandler(toolName)).toBeDefined();
      }
    });

    it('returns undefined for unknown tools', () => {
      expect(hasToolHandler('unknown_tool')).toBe(false);
      expect(getToolHandler('unknown_tool')).toBeUndefined();
    });
  });

  describe('Capability-injected tool handlers', () => {
    beforeEach(() => {
      const context = createMetaMaskE2EContext();
      sessionManager.setWorkflowContext(context as unknown as WorkflowContext);
    });

    afterEach(() => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );
    });

    it('mm_build handler uses BuildCapability from context', async () => {
      const handler = getToolHandler('mm_build');
      expect(handler).toBeDefined();
      if (!handler) {
        throw new Error('Handler not found');
      }

      const buildCapability = sessionManager.getBuildCapability();
      expect(buildCapability).toBeDefined();
      if (!buildCapability) {
        throw new Error('BuildCapability not found');
      }

      const isBuiltSpy = jest
        .spyOn(buildCapability, 'isBuilt')
        .mockResolvedValue(true);

      const result = await handler({ force: false }, {});

      expect(isBuiltSpy).toHaveBeenCalled();
      expect(result.ok).toBe(true);

      isBuiltSpy.mockRestore();
    });
  });

  describe('Backward compatibility', () => {
    it('tools work even when context is not set (legacy mode)', async () => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );

      const handler = getToolHandler('mm_knowledge_sessions');
      expect(handler).toBeDefined();
      if (!handler) {
        throw new Error('Handler not found');
      }

      const result = await handler({ limit: 5 }, {});

      expect(result).toBeDefined();
      expect(typeof result.ok).toBe('boolean');
    });

    it('context-dependent tools handle missing capabilities gracefully', async () => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );

      expect(sessionManager.getBuildCapability()).toBeUndefined();
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

    describe('with includeBuild option', () => {
      beforeEach(() => {
        const prodContext = createMetaMaskProdContext({ includeBuild: true });
        sessionManager.setWorkflowContext(
          prodContext as unknown as WorkflowContext,
        );
      });

      it('includes build capability when includeBuild is true', () => {
        expect(sessionManager.getBuildCapability()).toBeDefined();
      });
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
