import {
  buildInputSchema,
  launchInputSchema,
  navigateInputSchema,
  waitForNotificationInputSchema,
  clickInputSchema,
  typeInputSchema,
  waitForInputSchema,
  knowledgeLastInputSchema,
  knowledgeSearchInputSchema,
  knowledgeSummarizeInputSchema,
  knowledgeSessionsInputSchema,
  targetSelectionSchema,
  knowledgeScopeSchema,
  knowledgeFiltersSchema,
  toolSchemas,
  validateToolInput,
  safeValidateToolInput,
} from './schemas';

describe('Zod Schemas', () => {
  describe('targetSelectionSchema', () => {
    it('accepts valid testId', () => {
      const result = targetSelectionSchema.safeParse({ testId: 'send-button' });
      expect(result.success).toBe(true);
    });

    it('accepts valid a11yRef', () => {
      const result = targetSelectionSchema.safeParse({ a11yRef: 'e1' });
      expect(result.success).toBe(true);
    });

    it('accepts valid selector', () => {
      const result = targetSelectionSchema.safeParse({
        selector: '.btn-primary',
      });
      expect(result.success).toBe(true);
    });

    it('rejects when no target is provided', () => {
      const result = targetSelectionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects when multiple targets are provided', () => {
      const result = targetSelectionSchema.safeParse({
        testId: 'button',
        selector: '.button',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid a11yRef format', () => {
      const result = targetSelectionSchema.safeParse({ a11yRef: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('accepts a11yRef with multiple digits', () => {
      const result = targetSelectionSchema.safeParse({ a11yRef: 'e123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty testId', () => {
      const result = targetSelectionSchema.safeParse({ testId: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('knowledgeScopeSchema', () => {
    it('accepts "current"', () => {
      const result = knowledgeScopeSchema.safeParse('current');
      expect(result.success).toBe(true);
    });

    it('accepts "all"', () => {
      const result = knowledgeScopeSchema.safeParse('all');
      expect(result.success).toBe(true);
    });

    it('accepts sessionId object', () => {
      const result = knowledgeScopeSchema.safeParse({
        sessionId: 'mm-test-session',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid string', () => {
      const result = knowledgeScopeSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('rejects sessionId shorter than 4 characters', () => {
      const result = knowledgeScopeSchema.safeParse({ sessionId: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('knowledgeFiltersSchema', () => {
    it('accepts valid filters', () => {
      const result = knowledgeFiltersSchema.safeParse({
        flowTag: 'send',
        tag: 'smoke',
        screen: 'home',
        sinceHours: 24,
        gitBranch: 'main',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = knowledgeFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts undefined', () => {
      const result = knowledgeFiltersSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('rejects sinceHours below 1', () => {
      const result = knowledgeFiltersSchema.safeParse({ sinceHours: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects sinceHours above 720', () => {
      const result = knowledgeFiltersSchema.safeParse({ sinceHours: 721 });
      expect(result.success).toBe(false);
    });
  });

  describe('buildInputSchema', () => {
    it('accepts empty object with defaults', () => {
      const result = buildInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.buildType).toBe('build:test');
        expect(result.data.force).toBe(false);
      }
    });

    it('accepts valid buildType', () => {
      const result = buildInputSchema.safeParse({ buildType: 'build:test' });
      expect(result.success).toBe(true);
    });

    it('accepts force flag', () => {
      const result = buildInputSchema.safeParse({ force: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.force).toBe(true);
      }
    });

    it('rejects invalid buildType', () => {
      const result = buildInputSchema.safeParse({ buildType: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('launchInputSchema', () => {
    it('accepts empty object with defaults', () => {
      const result = launchInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stateMode).toBe('default');
        expect(result.data.autoBuild).toBe(true);
        expect(result.data.slowMo).toBe(0);
      }
    });

    it('accepts valid stateMode', () => {
      const result = launchInputSchema.safeParse({ stateMode: 'onboarding' });
      expect(result.success).toBe(true);
    });

    it('accepts fixturePreset', () => {
      const result = launchInputSchema.safeParse({
        stateMode: 'custom',
        fixturePreset: 'withMultipleAccounts',
      });
      expect(result.success).toBe(true);
    });

    it('accepts flowTags and tags', () => {
      const result = launchInputSchema.safeParse({
        flowTags: ['send', 'swap'],
        tags: ['smoke', 'regression'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts ports configuration', () => {
      const result = launchInputSchema.safeParse({
        ports: { anvil: 8546, fixtureServer: 12346 },
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid port number', () => {
      const result = launchInputSchema.safeParse({
        ports: { anvil: 70000 },
      });
      expect(result.success).toBe(false);
    });

    it('rejects slowMo above 10000', () => {
      const result = launchInputSchema.safeParse({ slowMo: 15000 });
      expect(result.success).toBe(false);
    });
  });

  describe('navigateInputSchema', () => {
    it('accepts valid screen', () => {
      const result = navigateInputSchema.safeParse({ screen: 'home' });
      expect(result.success).toBe(true);
    });

    it('accepts url screen with url', () => {
      const result = navigateInputSchema.safeParse({
        screen: 'url',
        url: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects url screen without url', () => {
      const result = navigateInputSchema.safeParse({ screen: 'url' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid screen', () => {
      const result = navigateInputSchema.safeParse({ screen: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('waitForNotificationInputSchema', () => {
    it('accepts empty object with defaults', () => {
      const result = waitForNotificationInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeoutMs).toBe(15000);
      }
    });

    it('accepts custom timeout', () => {
      const result = waitForNotificationInputSchema.safeParse({
        timeoutMs: 30000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects timeout below 1000', () => {
      const result = waitForNotificationInputSchema.safeParse({
        timeoutMs: 500,
      });
      expect(result.success).toBe(false);
    });

    it('rejects timeout above 60000', () => {
      const result = waitForNotificationInputSchema.safeParse({
        timeoutMs: 70000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('clickInputSchema', () => {
    it('accepts testId with default timeout', () => {
      const result = clickInputSchema.safeParse({ testId: 'button' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeoutMs).toBe(15000);
      }
    });

    it('accepts a11yRef', () => {
      const result = clickInputSchema.safeParse({ a11yRef: 'e5' });
      expect(result.success).toBe(true);
    });

    it('accepts custom timeout', () => {
      const result = clickInputSchema.safeParse({
        testId: 'button',
        timeoutMs: 5000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects without target', () => {
      const result = clickInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects timeout above 60000', () => {
      const result = clickInputSchema.safeParse({
        testId: 'button',
        timeoutMs: 70000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('typeInputSchema', () => {
    it('accepts testId and text', () => {
      const result = typeInputSchema.safeParse({
        testId: 'input',
        text: 'hello',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a11yRef and text', () => {
      const result = typeInputSchema.safeParse({
        a11yRef: 'e1',
        text: 'hello',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty string as text', () => {
      const result = typeInputSchema.safeParse({ testId: 'input', text: '' });
      expect(result.success).toBe(true);
    });

    it('rejects without text', () => {
      const result = typeInputSchema.safeParse({ testId: 'input' });
      expect(result.success).toBe(false);
    });

    it('rejects without target', () => {
      const result = typeInputSchema.safeParse({ text: 'hello' });
      expect(result.success).toBe(false);
    });
  });

  describe('waitForInputSchema', () => {
    it('accepts testId with default timeout', () => {
      const result = waitForInputSchema.safeParse({ testId: 'element' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeoutMs).toBe(15000);
      }
    });

    it('accepts custom timeout up to 120000', () => {
      const result = waitForInputSchema.safeParse({
        testId: 'element',
        timeoutMs: 120000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects timeout below 100', () => {
      const result = waitForInputSchema.safeParse({
        testId: 'element',
        timeoutMs: 50,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('knowledgeLastInputSchema', () => {
    it('accepts empty object with defaults', () => {
      const result = knowledgeLastInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.n).toBe(20);
        expect(result.data.scope).toBe('current');
      }
    });

    it('accepts custom n', () => {
      const result = knowledgeLastInputSchema.safeParse({ n: 50 });
      expect(result.success).toBe(true);
    });

    it('rejects n above 200', () => {
      const result = knowledgeLastInputSchema.safeParse({ n: 250 });
      expect(result.success).toBe(false);
    });

    it('accepts scope with sessionId', () => {
      const result = knowledgeLastInputSchema.safeParse({
        scope: { sessionId: 'mm-test' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('knowledgeSearchInputSchema', () => {
    it('requires query', () => {
      const result = knowledgeSearchInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts query with defaults', () => {
      const result = knowledgeSearchInputSchema.safeParse({ query: 'send' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.scope).toBe('all');
      }
    });

    it('rejects query longer than 200 characters', () => {
      const result = knowledgeSearchInputSchema.safeParse({
        query: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('accepts filters', () => {
      const result = knowledgeSearchInputSchema.safeParse({
        query: 'click',
        filters: { flowTag: 'send' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('knowledgeSummarizeInputSchema', () => {
    it('accepts empty object with defaults', () => {
      const result = knowledgeSummarizeInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scope).toBe('current');
      }
    });

    it('accepts scope with sessionId', () => {
      const result = knowledgeSummarizeInputSchema.safeParse({
        scope: { sessionId: 'mm-test-session' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects "all" as scope', () => {
      const result = knowledgeSummarizeInputSchema.safeParse({ scope: 'all' });
      expect(result.success).toBe(false);
    });
  });

  describe('knowledgeSessionsInputSchema', () => {
    it('accepts empty object with defaults', () => {
      const result = knowledgeSessionsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('rejects limit above 50', () => {
      const result = knowledgeSessionsInputSchema.safeParse({ limit: 60 });
      expect(result.success).toBe(false);
    });

    it('accepts filters', () => {
      const result = knowledgeSessionsInputSchema.safeParse({
        filters: { sinceHours: 48 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('toolSchemas map', () => {
    it('contains all expected tools', () => {
      expect(Object.keys(toolSchemas)).toEqual([
        'mm_build',
        'mm_launch',
        'mm_cleanup',
        'mm_get_state',
        'mm_navigate',
        'mm_wait_for_notification',
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
      ]);
    });
  });

  describe('validateToolInput', () => {
    it('returns parsed data for valid input', () => {
      const result = validateToolInput('mm_build', { force: true });
      expect(result.force).toBe(true);
    });

    it('throws ZodError for invalid input', () => {
      expect(() =>
        validateToolInput('mm_click', { testId: '', selector: 'x' }),
      ).toThrow();
    });
  });

  describe('safeValidateToolInput', () => {
    it('returns success true for valid input', () => {
      const result = safeValidateToolInput('mm_build', { force: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.force).toBe(true);
      }
    });

    it('returns success false for invalid input', () => {
      const result = safeValidateToolInput('mm_click', {});
      expect(result.success).toBe(false);
    });

    it('provides error details for invalid input', () => {
      const result = safeValidateToolInput('mm_navigate', {
        screen: 'url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});
