'use strict';

const CHECK_RESULT_ASSERT = { operator: 'eq', field: 'pass', value: true };
const CHECK_RESULT_FIXTURES = {
  pass: '{"pass":true}',
  fail: '{"pass":false}',
};

const REGISTRY = {
  'wallet.unlocked': {
    description: 'Extension is loaded and wallet is unlocked',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (callHandler, _params, context) => {
      const result = await callHandler('mm_get_state', {});
      if (!result.ok) {
        return {
          pass: false,
          hint: 'Extension not loaded or no active session. Call mm_launch first.',
        };
      }
      const state = result.result?.state;
      if (state?.isUnlocked === true) {
        return { pass: true, hint: 'Wallet is unlocked' };
      }
      if (context) {
        try {
          const page = context.getPage();
          const lockCount = await page
            .locator('[data-testid="unlock-password"]')
            .count();
          if (lockCount === 0) {
            return { pass: true, hint: 'Wallet is unlocked (DOM check)' };
          }
        } catch {}
      }
      return {
        pass: false,
        hint: 'Wallet is locked. Unlock it first (type password + press unlock-submit).',
      };
    },
  },

  'extension.loaded': {
    description: 'Extension is loaded and responsive',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (callHandler) => {
      const result = await callHandler('mm_get_state', {});
      return {
        pass: result.ok,
        hint: result.ok
          ? 'Extension is loaded'
          : 'Extension is not responding. Check that the browser is running and extension is loaded.',
      };
    },
  },

  'ext.element_visible': {
    description: 'A specific data-testid element is visible on screen',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (callHandler, params) => {
      const testId = params?.testId;
      if (!testId)
        return {
          pass: false,
          hint: 'ext.element_visible requires a testId parameter.',
        };
      const result = await callHandler('mm_wait_for', {
        testId,
        timeoutMs: 5000,
      });
      if (!result.ok)
        return {
          pass: false,
          hint: `Element [data-testid="${testId}"] not found on screen.`,
        };
      const { found } = result.result;
      return {
        pass: found === true,
        hint: found
          ? `Element "${testId}" is visible`
          : `Element [data-testid="${testId}"] not found.`,
      };
    },
  },

  'ext.on_screen': {
    description: 'Extension is on a specific screen (URL hash)',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (callHandler, params) => {
      const hash = params?.hash;
      if (!hash)
        return {
          pass: false,
          hint: 'ext.on_screen requires a hash parameter.',
        };
      const result = await callHandler('mm_get_state', {});
      if (!result.ok)
        return { pass: false, hint: 'Cannot get state to check screen.' };
      const currentUrl = result.result?.state?.currentUrl;
      const includes = currentUrl?.includes(hash) ?? false;
      return {
        pass: includes,
        hint: includes
          ? `On expected screen (hash contains "${hash}")`
          : `Expected URL hash to contain "${hash}", got "${currentUrl ?? 'unknown'}".`,
      };
    },
  },
};

module.exports = { REGISTRY };
