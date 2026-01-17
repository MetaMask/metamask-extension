import * as path from 'path';
import { promises as fs } from 'fs';
import { KnowledgeStore } from '../playwright/llm-workflow/mcp-server/knowledge-store';
import type {
  PriorKnowledgeContext,
  StepRecord,
  SessionMetadata,
  TestIdItem,
  A11yNodeTrimmed,
} from '../playwright/llm-workflow/mcp-server/types';

let testCounter = 0;

function getTestRoot(): string {
  testCounter += 1;
  return path.join(
    __dirname,
    `../../test-artifacts/llm-knowledge-test-${testCounter}`,
  );
}

describe('KnowledgeStore', () => {
  let store: KnowledgeStore;
  let testRoot: string;

  beforeEach(async () => {
    testRoot = getTestRoot();
    await fs.mkdir(testRoot, { recursive: true });
    store = new KnowledgeStore(testRoot);
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  describe('generatePriorKnowledge', () => {
    const createMockSessionMetadata = (
      sessionId: string,
      flowTags: string[] = [],
      hoursAgo = 1,
    ): SessionMetadata => ({
      schemaVersion: 1,
      sessionId,
      createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      goal: 'Test session',
      flowTags,
      tags: [],
      launch: {
        stateMode: 'default',
      },
    });

    const createMockStepRecord = (
      sessionId: string,
      screen: 'home' | 'unlock' | 'settings' | 'unknown',
      toolName: string,
      testId?: string,
      ok = true,
    ): StepRecord => ({
      schemaVersion: 1,
      timestamp: new Date().toISOString(),
      sessionId,
      tool: {
        name: toolName,
        target: testId ? { testId } : undefined,
      },
      outcome: {
        ok,
        error: ok
          ? undefined
          : { code: 'MM_TARGET_NOT_FOUND', message: 'Element not found' },
      },
      observation: {
        state: {
          currentScreen: screen,
          currentUrl: `chrome-extension://abc123/home.html#/${screen}`,
          extensionId: 'abc123',
          balance: '25 ETH',
          networkName: 'Localhost 8545',
          accountAddress: '0x1234567890123456789012345678901234567890',
          isLoaded: true,
          isUnlocked: true,
          chainId: 1337,
        },
        testIds: [
          { testId: 'coin-overview-send', tag: 'button', visible: true },
          { testId: 'account-menu-icon', tag: 'div', visible: true },
        ],
        a11y: {
          nodes: [
            { ref: 'e1', role: 'button', name: 'Send', path: ['main'] },
            { ref: 'e2', role: 'button', name: 'Receive', path: ['main'] },
          ],
        },
      },
      labels: ['interaction'],
    });

    const createMockContext = (
      screen: string,
      testIds: TestIdItem[] = [],
      a11yNodes: A11yNodeTrimmed[] = [],
    ): PriorKnowledgeContext => ({
      currentScreen: screen,
      currentUrl: `chrome-extension://abc123/home.html#/${screen}`,
      visibleTestIds:
        testIds.length > 0
          ? testIds
          : [
              { testId: 'coin-overview-send', tag: 'button', visible: true },
              { testId: 'account-menu-icon', tag: 'div', visible: true },
            ],
      a11yNodes:
        a11yNodes.length > 0
          ? a11yNodes
          : [
              { ref: 'e1', role: 'button', name: 'Send', path: ['main'] },
              { ref: 'e2', role: 'button', name: 'Receive', path: ['main'] },
            ],
      currentSessionFlowTags: ['send'],
    });

    it('returns undefined when no prior sessions exist', async () => {
      const context = createMockContext('home');
      const result = await store.generatePriorKnowledge(
        context,
        'mm-current-session',
      );

      expect(result).toBeUndefined();
    });

    it('returns prior knowledge when similar steps exist', async () => {
      const priorSessionId = 'mm-prior-session-1';
      await store.writeSessionMetadata(
        createMockSessionMetadata(priorSessionId, ['send']),
      );

      const stepsDir = path.join(testRoot, priorSessionId, 'steps');
      await fs.mkdir(stepsDir, { recursive: true });

      const step = createMockStepRecord(
        priorSessionId,
        'home',
        'mm_click',
        'coin-overview-send',
      );
      await fs.writeFile(
        path.join(stepsDir, '20260116T120000.000Z-mm_click.json'),
        JSON.stringify(step),
      );

      const context = createMockContext('home');
      const result = await store.generatePriorKnowledge(
        context,
        'mm-current-session',
      );

      expect(result).toBeDefined();
      expect(result?.schemaVersion).toBe(1);
      expect(result?.relatedSessions.length).toBeGreaterThanOrEqual(1);
      expect(result?.similarSteps.length).toBeGreaterThanOrEqual(1);
    });

    it('excludes the current session from prior knowledge', async () => {
      const currentSessionId = 'mm-current-session';
      await store.writeSessionMetadata(
        createMockSessionMetadata(currentSessionId, ['send']),
      );

      const stepsDir = path.join(testRoot, currentSessionId, 'steps');
      await fs.mkdir(stepsDir, { recursive: true });

      const step = createMockStepRecord(
        currentSessionId,
        'home',
        'mm_click',
        'coin-overview-send',
      );
      await fs.writeFile(
        path.join(stepsDir, '20260116T120000.000Z-mm_click.json'),
        JSON.stringify(step),
      );

      const context = createMockContext('home');
      const result = await store.generatePriorKnowledge(
        context,
        currentSessionId,
      );

      expect(result).toBeUndefined();
    });

    it('excludes discovery tools from similar steps', async () => {
      const priorSessionId = 'mm-prior-session-discovery';
      await store.writeSessionMetadata(
        createMockSessionMetadata(priorSessionId, ['send']),
      );

      const stepsDir = path.join(testRoot, priorSessionId, 'steps');
      await fs.mkdir(stepsDir, { recursive: true });

      const discoverStep = createMockStepRecord(
        priorSessionId,
        'home',
        'mm_describe_screen',
      );
      await fs.writeFile(
        path.join(stepsDir, '20260116T120000.000Z-mm_describe_screen.json'),
        JSON.stringify(discoverStep),
      );

      const context = createMockContext('home');
      const result = await store.generatePriorKnowledge(
        context,
        'mm-current-session',
      );

      expect(result?.similarSteps).toEqual([]);
      expect(result?.suggestedNextActions).toEqual([]);
    });

    it('builds avoid list from failed steps', async () => {
      const priorSessionId = 'mm-prior-session-failures';
      await store.writeSessionMetadata(
        createMockSessionMetadata(priorSessionId, ['send']),
      );

      const stepsDir = path.join(testRoot, priorSessionId, 'steps');
      await fs.mkdir(stepsDir, { recursive: true });

      const failedStep1 = createMockStepRecord(
        priorSessionId,
        'home',
        'mm_click',
        'broken-button',
        false,
      );
      const failedStep2 = createMockStepRecord(
        priorSessionId,
        'home',
        'mm_click',
        'broken-button',
        false,
      );
      const successStep = createMockStepRecord(
        priorSessionId,
        'home',
        'mm_click',
        'coin-overview-send',
        true,
      );

      await fs.writeFile(
        path.join(stepsDir, '20260116T120001.000Z-mm_click.json'),
        JSON.stringify(failedStep1),
      );
      await fs.writeFile(
        path.join(stepsDir, '20260116T120002.000Z-mm_click.json'),
        JSON.stringify(failedStep2),
      );
      await fs.writeFile(
        path.join(stepsDir, '20260116T120003.000Z-mm_click.json'),
        JSON.stringify(successStep),
      );

      const context = createMockContext('home');
      const result = await store.generatePriorKnowledge(
        context,
        'mm-current-session',
      );

      expect(result).toBeDefined();
      expect(result?.avoid).toBeDefined();
      expect(result?.avoid?.length).toBeGreaterThanOrEqual(1);
      expect(result?.avoid?.[0].target.testId).toBe('broken-button');
      expect(result?.avoid?.[0].frequency).toBe(2);
    });

    it('filters sessions by flowTag when provided', async () => {
      const sendSessionId = 'mm-prior-send-session';
      const swapSessionId = 'mm-prior-swap-session';

      await store.writeSessionMetadata(
        createMockSessionMetadata(sendSessionId, ['send']),
      );
      await store.writeSessionMetadata(
        createMockSessionMetadata(swapSessionId, ['swap']),
      );

      const sendStepsDir = path.join(testRoot, sendSessionId, 'steps');
      const swapStepsDir = path.join(testRoot, swapSessionId, 'steps');
      await fs.mkdir(sendStepsDir, { recursive: true });
      await fs.mkdir(swapStepsDir, { recursive: true });

      const sendStep = createMockStepRecord(
        sendSessionId,
        'home',
        'mm_click',
        'coin-overview-send',
      );
      const swapStep = createMockStepRecord(
        swapSessionId,
        'home',
        'mm_click',
        'swap-button',
      );

      await fs.writeFile(
        path.join(sendStepsDir, '20260116T120000.000Z-mm_click.json'),
        JSON.stringify(sendStep),
      );
      await fs.writeFile(
        path.join(swapStepsDir, '20260116T120000.000Z-mm_click.json'),
        JSON.stringify(swapStep),
      );

      const context = createMockContext('home');
      context.currentSessionFlowTags = ['send'];

      const result = await store.generatePriorKnowledge(
        context,
        'mm-current-session',
      );

      expect(result).toBeDefined();
      expect(
        result?.relatedSessions.every((s) => s.flowTags.includes('send')),
      ).toBe(true);
    });

    it('respects hard limits on output size', async () => {
      for (let i = 0; i < 10; i++) {
        const sid = `mm-prior-session-limit-${i}`;
        await store.writeSessionMetadata(
          createMockSessionMetadata(sid, ['send']),
        );

        const stepsDir = path.join(testRoot, sid, 'steps');
        await fs.mkdir(stepsDir, { recursive: true });

        for (let j = 0; j < 5; j++) {
          const step = createMockStepRecord(
            sid,
            'home',
            'mm_click',
            `button-${j}`,
          );
          await fs.writeFile(
            path.join(stepsDir, `20260116T12000${j}.000Z-mm_click.json`),
            JSON.stringify(step),
          );
        }
      }

      const context = createMockContext('home');
      const result = await store.generatePriorKnowledge(
        context,
        'mm-current-session',
      );

      expect(result).toBeDefined();
      expect(result?.relatedSessions.length).toBeLessThanOrEqual(5);
      expect(result?.similarSteps.length).toBeLessThanOrEqual(10);
      expect(result?.suggestedNextActions.length).toBeLessThanOrEqual(5);
    });

    it('builds suggested actions with preferred targets', async () => {
      const priorSessionId = 'mm-prior-session-actions';
      await store.writeSessionMetadata(
        createMockSessionMetadata(priorSessionId, ['send']),
      );

      const stepsDir = path.join(testRoot, priorSessionId, 'steps');
      await fs.mkdir(stepsDir, { recursive: true });

      const step = createMockStepRecord(
        priorSessionId,
        'home',
        'mm_click',
        'coin-overview-send',
      );
      await fs.writeFile(
        path.join(stepsDir, '20260116T120000.000Z-mm_click.json'),
        JSON.stringify(step),
      );

      const context = createMockContext('home');
      const result = await store.generatePriorKnowledge(
        context,
        'mm-current-session',
      );

      expect(result).toBeDefined();
      expect(result?.suggestedNextActions.length).toBeGreaterThanOrEqual(1);

      const firstAction = result?.suggestedNextActions[0];
      expect(firstAction?.action).toBe('click');
      expect(firstAction?.preferredTarget.type).toBe('testId');
      expect(firstAction?.preferredTarget.value).toBe('coin-overview-send');
    });
  });
});
