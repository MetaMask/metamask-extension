import * as path from 'path';
import { promises as fs } from 'fs';
import type { ExtensionState } from '../types';
import {
  KnowledgeStore,
  createDefaultObservation,
  tokenize,
  tokenizeIdentifier,
  expandWithSynonyms,
} from './knowledge-store';

const TEST_KNOWLEDGE_ROOT = path.join(
  process.cwd(),
  'test-artifacts',
  'llm-knowledge-test',
);

jest.mock('child_process', () => ({
  execSync: jest.fn((cmd: string) => {
    if (cmd.includes('rev-parse --abbrev-ref HEAD')) {
      return 'main\n';
    }
    if (cmd.includes('rev-parse --short HEAD')) {
      return 'abc123\n';
    }
    if (cmd.includes('status --porcelain')) {
      return '';
    }
    return '';
  }),
}));

describe('KnowledgeStore', () => {
  let knowledgeStore: KnowledgeStore;
  const testSessionId = 'mm-test-session-123';

  beforeAll(async () => {
    await fs.mkdir(TEST_KNOWLEDGE_ROOT, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_KNOWLEDGE_ROOT, { recursive: true, force: true });
  });

  beforeEach(() => {
    knowledgeStore = new KnowledgeStore(TEST_KNOWLEDGE_ROOT);
  });

  afterEach(async () => {
    const entries = await fs.readdir(TEST_KNOWLEDGE_ROOT).catch(() => []);
    for (const entry of entries) {
      await fs.rm(path.join(TEST_KNOWLEDGE_ROOT, entry), {
        recursive: true,
        force: true,
      });
    }
  });

  describe('writeSessionMetadata', () => {
    it('creates session directory and writes metadata', async () => {
      const metadata = {
        schemaVersion: 1 as const,
        sessionId: testSessionId,
        createdAt: new Date().toISOString(),
        goal: 'Test session',
        flowTags: ['send'],
        tags: ['smoke'],
        launch: {
          stateMode: 'default' as const,
          fixturePreset: null,
        },
      };

      const filepath = await knowledgeStore.writeSessionMetadata(metadata);

      expect(filepath).toContain(testSessionId);
      expect(filepath).toContain('session.json');

      const content = await fs.readFile(filepath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.sessionId).toBe(testSessionId);
      expect(parsed.goal).toBe('Test session');
    });
  });

  describe('readSessionMetadata', () => {
    it('returns null for non-existent session', async () => {
      const metadata = await knowledgeStore.readSessionMetadata('non-existent');
      expect(metadata).toBeNull();
    });

    it('reads existing session metadata', async () => {
      const metadata = {
        schemaVersion: 1 as const,
        sessionId: testSessionId,
        createdAt: new Date().toISOString(),
        flowTags: ['swap'],
        tags: [],
        launch: { stateMode: 'default' as const },
      };

      await knowledgeStore.writeSessionMetadata(metadata);
      const read = await knowledgeStore.readSessionMetadata(testSessionId);

      expect(read).not.toBeNull();
      expect(read?.flowTags).toEqual(['swap']);
    });

    it('caches metadata after first read', async () => {
      const metadata = {
        schemaVersion: 1 as const,
        sessionId: testSessionId,
        createdAt: new Date().toISOString(),
        flowTags: [],
        tags: [],
        launch: { stateMode: 'default' as const },
      };

      await knowledgeStore.writeSessionMetadata(metadata);

      const read1 = await knowledgeStore.readSessionMetadata(testSessionId);
      const read2 = await knowledgeStore.readSessionMetadata(testSessionId);

      expect(read1).toBe(read2);
    });
  });

  describe('recordStep', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: '0x123',
      networkName: 'Localhost',
      chainId: 1337,
      balance: '10 ETH',
    };

    it('records a step with all fields', async () => {
      const filepath = await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        input: { timeoutMs: 5000 },
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState, [], []),
        durationMs: 150,
      });

      expect(filepath).toContain(testSessionId);
      expect(filepath).toContain('mm_click.json');

      const content = await fs.readFile(filepath, 'utf-8');
      const step = JSON.parse(content);

      expect(step.schemaVersion).toBe(1);
      expect(step.sessionId).toBe(testSessionId);
      expect(step.tool.name).toBe('mm_click');
      expect(step.tool.target.testId).toBe('send-button');
      expect(step.outcome.ok).toBe(true);
      expect(step.timing.durationMs).toBe(150);
    });

    it('sanitizes sensitive input', async () => {
      const filepath = await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_type',
        input: { text: 'secret123', testId: 'password-input' },
        target: { testId: 'password-input' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState, [], []),
      });

      const content = await fs.readFile(filepath, 'utf-8');
      const step = JSON.parse(content);

      expect(step.tool.input.text).toBe('[REDACTED]');
      expect(step.tool.textRedacted).toBe(true);
      expect(step.tool.textLength).toBe(9);
    });

    it('adds discovery label for discovery tools', async () => {
      const filepath = await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_describe_screen',
        outcome: { ok: true },
        observation: createDefaultObservation(mockState, [], []),
      });

      const content = await fs.readFile(filepath, 'utf-8');
      const step = JSON.parse(content);

      expect(step.labels).toContain('discovery');
    });

    it('adds interaction label for interaction tools', async () => {
      const filepath = await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'some-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState, [], []),
      });

      const content = await fs.readFile(filepath, 'utf-8');
      const step = JSON.parse(content);

      expect(step.labels).toContain('interaction');
    });

    it('adds confirmation label for confirm actions', async () => {
      const filepath = await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'confirm-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState, [], []),
      });

      const content = await fs.readFile(filepath, 'utf-8');
      const step = JSON.parse(content);

      expect(step.labels).toContain('confirmation');
    });

    it('adds error-recovery label for failed steps', async () => {
      const filepath = await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'missing-button' },
        outcome: {
          ok: false,
          error: { code: 'MM_TARGET_NOT_FOUND', message: 'Not found' },
        },
        observation: createDefaultObservation(mockState, [], []),
      });

      const content = await fs.readFile(filepath, 'utf-8');
      const step = JSON.parse(content);

      expect(step.labels).toContain('error-recovery');
    });
  });

  describe('getLastSteps', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await knowledgeStore.recordStep({
          sessionId: testSessionId,
          toolName: `mm_click`,
          target: { testId: `button-${i}` },
          outcome: { ok: true },
          observation: createDefaultObservation(mockState, [], []),
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    it('returns last N steps in reverse chronological order', async () => {
      const steps = await knowledgeStore.getLastSteps(
        3,
        'current',
        testSessionId,
      );

      expect(steps).toHaveLength(3);
      expect(steps[0].snippet).toContain('button-4');
      expect(steps[1].snippet).toContain('button-3');
      expect(steps[2].snippet).toContain('button-2');
    });

    it('returns all steps if n is larger than available', async () => {
      const steps = await knowledgeStore.getLastSteps(
        100,
        'current',
        testSessionId,
      );
      expect(steps).toHaveLength(5);
    });

    it('returns empty array for non-existent session', async () => {
      const steps = await knowledgeStore.getLastSteps(
        10,
        { sessionId: 'non-existent' },
        undefined,
      );
      expect(steps).toHaveLength(0);
    });
  });

  describe('searchSteps', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    beforeEach(async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(
          { ...mockState, currentScreen: 'home' },
          [{ testId: 'send-button', tag: 'button', visible: true }],
          [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
        ),
      });

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_type',
        target: { testId: 'amount-input' },
        input: { text: '0.1' },
        outcome: { ok: true },
        observation: createDefaultObservation(
          { ...mockState, currentScreen: 'settings' },
          [],
          [],
        ),
      });
    });

    it('finds steps matching tool name', async () => {
      const results = await knowledgeStore.searchSteps(
        'click',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tool).toBe('mm_click');
    });

    it('finds steps matching testId', async () => {
      const results = await knowledgeStore.searchSteps(
        'send-button',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it('finds steps matching screen name', async () => {
      const results = await knowledgeStore.searchSteps(
        'settings',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty array for no matches', async () => {
      const results = await knowledgeStore.searchSteps(
        'nonexistent-query-xyz',
        10,
        'current',
        testSessionId,
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('summarizeSession', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    beforeEach(async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_describe_screen',
        outcome: { ok: true },
        observation: createDefaultObservation(mockState, [], []),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState, [], []),
      });
    });

    it('generates recipe with step numbers', async () => {
      const summary = await knowledgeStore.summarizeSession(testSessionId);

      expect(summary.sessionId).toBe(testSessionId);
      expect(summary.stepCount).toBe(2);
      expect(summary.recipe).toHaveLength(2);
      expect(summary.recipe[0].stepNumber).toBe(1);
      expect(summary.recipe[0].tool).toBe('mm_describe_screen');
      expect(summary.recipe[1].stepNumber).toBe(2);
      expect(summary.recipe[1].tool).toBe('mm_click');
    });

    it('includes target info in notes', async () => {
      const summary = await knowledgeStore.summarizeSession(testSessionId);

      const clickStep = summary.recipe.find((s) => s.tool === 'mm_click');
      expect(clickStep?.notes).toContain('send-button');
    });
  });

  describe('listSessions', () => {
    beforeEach(async () => {
      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: 'mm-session-1',
        createdAt: new Date(Date.now() - 1000).toISOString(),
        flowTags: ['send'],
        tags: ['smoke'],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: 'mm-session-2',
        createdAt: new Date().toISOString(),
        flowTags: ['swap'],
        tags: [],
        launch: { stateMode: 'default' },
      });
    });

    it('lists sessions in reverse chronological order', async () => {
      const sessions = await knowledgeStore.listSessions(10);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].sessionId).toBe('mm-session-2');
      expect(sessions[1].sessionId).toBe('mm-session-1');
    });

    it('filters by flowTag', async () => {
      const sessions = await knowledgeStore.listSessions(10, {
        flowTag: 'send',
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe('mm-session-1');
    });

    it('respects limit', async () => {
      const sessions = await knowledgeStore.listSessions(1);
      expect(sessions).toHaveLength(1);
    });
  });

  describe('createDefaultObservation', () => {
    it('creates observation with all fields', () => {
      const state: ExtensionState = {
        isLoaded: true,
        currentUrl: 'test',
        extensionId: 'ext',
        isUnlocked: true,
        currentScreen: 'home',
        accountAddress: '0x123',
        networkName: 'Mainnet',
        chainId: 1,
        balance: '1 ETH',
      };

      const testIds = [{ testId: 'btn', tag: 'button', visible: true }];
      const a11yNodes = [{ ref: 'e1', role: 'button', name: 'Send', path: [] }];

      const observation = createDefaultObservation(state, testIds, a11yNodes);

      expect(observation.state).toBe(state);
      expect(observation.testIds).toBe(testIds);
      expect(observation.a11y.nodes).toBe(a11yNodes);
    });

    it('uses empty arrays as defaults', () => {
      const state: ExtensionState = {
        isLoaded: true,
        currentUrl: 'test',
        extensionId: 'ext',
        isUnlocked: false,
        currentScreen: 'unlock',
        accountAddress: null,
        networkName: null,
        chainId: null,
        balance: null,
      };

      const observation = createDefaultObservation(state);

      expect(observation.testIds).toEqual([]);
      expect(observation.a11y.nodes).toEqual([]);
    });
  });

  describe('tokenize', () => {
    it('splits query into individual words', () => {
      const tokens = tokenize('send flow ETH to another account');
      expect(tokens).toContain('send');
      expect(tokens).toContain('eth');
      expect(tokens).toContain('another');
      expect(tokens).toContain('account');
    });

    it('removes stopwords', () => {
      const tokens = tokenize('send to the account');
      expect(tokens).not.toContain('to');
      expect(tokens).not.toContain('the');
    });

    it('removes short tokens', () => {
      const tokens = tokenize('a b cd efg');
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('b');
      expect(tokens).toContain('cd');
      expect(tokens).toContain('efg');
    });

    it('handles empty and whitespace strings', () => {
      expect(tokenize('')).toEqual([]);
      expect(tokenize('   ')).toEqual([]);
    });

    it('deduplicates tokens', () => {
      const tokens = tokenize('send send SEND');
      expect(tokens).toEqual(['send']);
    });

    it('removes flow and test stopwords', () => {
      const tokens = tokenize('send flow test');
      expect(tokens).toContain('send');
      expect(tokens).not.toContain('flow');
      expect(tokens).not.toContain('test');
    });
  });

  describe('tokenizeIdentifier', () => {
    it('splits kebab-case', () => {
      const tokens = tokenizeIdentifier('coin-overview-send-button');
      expect(tokens).toEqual(['coin', 'overview', 'send', 'button']);
    });

    it('splits camelCase', () => {
      const tokens = tokenizeIdentifier('sendTokenButton');
      expect(tokens).toEqual(['send', 'token', 'button']);
    });

    it('splits snake_case', () => {
      const tokens = tokenizeIdentifier('send_token_btn');
      expect(tokens).toEqual(['send', 'token', 'btn']);
    });

    it('handles mixed formats', () => {
      const tokens = tokenizeIdentifier('coin-overview_sendButton');
      expect(tokens).toContain('coin');
      expect(tokens).toContain('overview');
      expect(tokens).toContain('send');
      expect(tokens).toContain('button');
    });

    it('handles uppercase abbreviations', () => {
      const tokens = tokenizeIdentifier('sendETHButton');
      expect(tokens).toContain('send');
      expect(tokens).toContain('eth');
      expect(tokens).toContain('button');
    });

    it('returns empty array for empty input', () => {
      expect(tokenizeIdentifier('')).toEqual([]);
    });
  });

  describe('expandWithSynonyms', () => {
    it('expands canonical terms to synonyms', () => {
      const expanded = expandWithSynonyms(['send']);
      expect(expanded).toContain('send');
      expect(expanded).toContain('transfer');
      expect(expanded).toContain('pay');
    });

    it('expands synonym terms to canonical and other synonyms', () => {
      const expanded = expandWithSynonyms(['transfer']);
      expect(expanded).toContain('send');
      expect(expanded).toContain('transfer');
      expect(expanded).toContain('pay');
    });

    it('does not expand non-action terms', () => {
      const expanded = expandWithSynonyms(['eth', 'account', 'balance']);
      expect(expanded).toEqual(['eth', 'account', 'balance']);
    });

    it('handles multiple tokens with some having synonyms', () => {
      const expanded = expandWithSynonyms(['send', 'eth']);
      expect(expanded).toContain('send');
      expect(expanded).toContain('transfer');
      expect(expanded).toContain('eth');
      expect(expanded).not.toContain('ethereum');
    });

    it('deduplicates results', () => {
      const expanded = expandWithSynonyms(['send', 'transfer']);
      const unique = [...new Set(expanded)];
      expect(expanded.length).toBe(unique.length);
    });
  });

  describe('searchSteps with tokenized queries', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    it('finds steps when any token matches', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(
          { ...mockState, currentScreen: 'home' },
          [],
          [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
        ),
      });

      const results = await knowledgeStore.searchSteps(
        'send flow ETH to account',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it('ranks results by token coverage', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-to-account' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'send account',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].snippet).toContain('send-to-account');
    });

    it('returns empty array for only stopwords', async () => {
      const results = await knowledgeStore.searchSteps(
        'to the a',
        10,
        'current',
        testSessionId,
      );

      expect(results).toEqual([]);
    });

    it('includes matchedFields in results', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(
          mockState,
          [],
          [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
        ),
      });

      const results = await knowledgeStore.searchSteps(
        'send',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedFields).toBeDefined();
    });
  });

  describe('searchSteps with session metadata', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    it('matches session goal tokens', async () => {
      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: testSessionId,
        createdAt: new Date().toISOString(),
        goal: 'Send 0.1 ETH to another account',
        flowTags: ['send'],
        tags: ['visual-test'],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'send ETH account',
        10,
        'all',
        undefined,
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it('prioritizes sessions with matching flowTags', async () => {
      const sendSessionId = 'mm-send-session';
      const swapSessionId = 'mm-swap-session';

      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: sendSessionId,
        createdAt: new Date().toISOString(),
        goal: 'Test send functionality',
        flowTags: ['send'],
        tags: [],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: swapSessionId,
        createdAt: new Date().toISOString(),
        goal: 'Test swap functionality',
        flowTags: ['swap'],
        tags: [],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.recordStep({
        sessionId: sendSessionId,
        toolName: 'mm_click',
        target: { testId: 'action-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      await knowledgeStore.recordStep({
        sessionId: swapSessionId,
        toolName: 'mm_click',
        target: { testId: 'action-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'send',
        10,
        'all',
        undefined,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sessionId).toBe(sendSessionId);
    });

    it('applies recency bonus to recent sessions', async () => {
      const oldSessionId = 'mm-old-session';
      const recentSessionId = 'mm-recent-session';

      const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000);
      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: oldSessionId,
        createdAt: oldDate.toISOString(),
        goal: 'Send tokens',
        flowTags: ['send'],
        tags: [],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: recentSessionId,
        createdAt: new Date().toISOString(),
        goal: 'Send tokens',
        flowTags: ['send'],
        tags: [],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.recordStep({
        sessionId: oldSessionId,
        toolName: 'mm_click',
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      await knowledgeStore.recordStep({
        sessionId: recentSessionId,
        toolName: 'mm_click',
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'send',
        10,
        'all',
        undefined,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sessionId).toBe(recentSessionId);
    });

    it('includes sessionGoal in results when available', async () => {
      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: testSessionId,
        createdAt: new Date().toISOString(),
        goal: 'Test send flow',
        flowTags: ['send'],
        tags: [],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'send',
        10,
        'all',
        undefined,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sessionGoal).toBe('Test send flow');
    });
  });

  describe('searchSteps with synonyms', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    it('matches when using synonym', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(
          mockState,
          [],
          [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
        ),
      });

      const results = await knowledgeStore.searchSteps(
        'transfer ETH',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it('matches session goals via synonyms', async () => {
      await knowledgeStore.writeSessionMetadata({
        schemaVersion: 1,
        sessionId: testSessionId,
        createdAt: new Date().toISOString(),
        goal: 'Send 0.1 ETH to another account',
        flowTags: ['send'],
        tags: [],
        launch: { stateMode: 'default' },
      });

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'transfer tokens',
        10,
        'all',
        undefined,
      );

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('searchSteps with tokenized testIds', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    it('matches tokenized testId components', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'coin-overview-send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'send',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedFields).toContain(
        'testId:coin-overview-send-button',
      );
    });

    it('matches camelCase testId components', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'sendTokenButton' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'token',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('snippet generation with match info', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    it('includes match evidence in snippet', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(
          mockState,
          [],
          [{ ref: 'e1', role: 'button', name: 'Send', path: [] }],
        ),
      });

      const results = await knowledgeStore.searchSteps(
        'send',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].snippet).toContain('match:');
    });
  });

  describe('tokenize stopwords', () => {
    it('filters out mm and mcp as tool-specific stopwords', () => {
      const tokens = tokenize('mm_click mcp server');
      expect(tokens).not.toContain('mm');
      expect(tokens).not.toContain('mcp');
      expect(tokens).toContain('click');
      expect(tokens).toContain('server');
    });

    it('prevents mm_click query from matching everything', async () => {
      const mockState: ExtensionState = {
        isLoaded: true,
        currentUrl: 'chrome-extension://test/home.html',
        extensionId: 'test-ext',
        isUnlocked: true,
        currentScreen: 'home',
        accountAddress: null,
        networkName: null,
        chainId: null,
        balance: null,
      };

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_type',
        target: { testId: 'amount-input' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const clickResults = await knowledgeStore.searchSteps(
        'click',
        10,
        'current',
        testSessionId,
      );

      expect(clickResults.length).toBe(1);
      expect(clickResults[0].tool).toBe('mm_click');
    });
  });

  describe('matchedFields deduplication', () => {
    const mockState: ExtensionState = {
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: null,
      networkName: null,
      chainId: null,
      balance: null,
    };

    it('deduplicates testId matches across multiple tokens', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'send-token-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(mockState),
      });

      const results = await knowledgeStore.searchSteps(
        'send token button',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);

      const testIdMatches = results[0].matchedFields?.filter((f) =>
        f.startsWith('testId:'),
      );
      expect(testIdMatches?.length).toBe(1);
      expect(testIdMatches?.[0]).toBe('testId:send-token-button');
    });

    it('deduplicates a11y matches across multiple tokens', async () => {
      await knowledgeStore.recordStep({
        sessionId: testSessionId,
        toolName: 'mm_click',
        target: { testId: 'action-button' },
        outcome: { ok: true },
        observation: createDefaultObservation(
          mockState,
          [],
          [{ ref: 'e1', role: 'button', name: 'Send Token', path: [] }],
        ),
      });

      const results = await knowledgeStore.searchSteps(
        'send token',
        10,
        'current',
        testSessionId,
      );

      expect(results.length).toBeGreaterThan(0);

      const a11yMatches = results[0].matchedFields?.filter((f) =>
        f.startsWith('a11y:'),
      );
      expect(a11yMatches?.length).toBe(1);
    });
  });
});
