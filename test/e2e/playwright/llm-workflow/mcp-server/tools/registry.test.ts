import { getToolHandler, hasToolHandler, toolHandlers } from './registry';

describe('tools/registry', () => {
  describe('toolHandlers', () => {
    it('contains all expected tool handlers', () => {
      const expectedTools = [
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
      ];

      for (const tool of expectedTools) {
        expect(toolHandlers[tool]).toBeDefined();
        expect(typeof toolHandlers[tool]).toBe('function');
      }
    });

    it('has exactly 21 handlers registered', () => {
      expect(Object.keys(toolHandlers)).toHaveLength(21);
    });
  });

  describe('getToolHandler', () => {
    it('returns handler for valid tool name', () => {
      const handler = getToolHandler('mm_build');
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('returns undefined for unknown tool name', () => {
      const handler = getToolHandler('mm_unknown');
      expect(handler).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const handler = getToolHandler('');
      expect(handler).toBeUndefined();
    });
  });

  describe('hasToolHandler', () => {
    it('returns true for registered tool', () => {
      expect(hasToolHandler('mm_build')).toBe(true);
      expect(hasToolHandler('mm_launch')).toBe(true);
      expect(hasToolHandler('mm_click')).toBe(true);
    });

    it('returns false for unknown tool', () => {
      expect(hasToolHandler('mm_unknown')).toBe(false);
      expect(hasToolHandler('')).toBe(false);
      expect(hasToolHandler('unknown')).toBe(false);
    });
  });
});
