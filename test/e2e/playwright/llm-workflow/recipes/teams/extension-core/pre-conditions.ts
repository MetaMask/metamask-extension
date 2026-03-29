/**
 * Core pre-condition registry for extension-core flows.
 */

import type {
  PreConditionRegistry,
  PreConditionContext,
  CallHandlerFn,
} from '../../lib/pre-condition-runner';

export const REGISTRY: PreConditionRegistry = {
  'wallet.unlocked': {
    description: 'Extension is loaded and wallet is unlocked',
    check: async (
      callHandler: CallHandlerFn,
      _params?: Record<string, unknown>,
      context?: PreConditionContext,
    ) => {
      // Primary: mm_get_state isUnlocked flag
      const result = await callHandler('mm_get_state', {});
      if (!result.ok) {
        return {
          pass: false,
          hint: 'Extension not loaded or no active session. Call mm_launch first.',
        };
      }
      const state = (result.result as Record<string, unknown>).state as
        | Record<string, unknown>
        | undefined;
      if (state?.isUnlocked === true) {
        return { pass: true, hint: 'Wallet is unlocked' };
      }

      // Fallback for CDP mode: isUnlocked may not be populated.
      // Check DOM — if unlock-password input is absent, wallet is unlocked.
      if (context) {
        try {
          const page = context.getPage();
          const lockCount = await page
            .locator('[data-testid="unlock-password"]')
            .count();
          if (lockCount === 0) {
            return { pass: true, hint: 'Wallet is unlocked (DOM check)' };
          }
        } catch {
          // Fallback failed, use original result
        }
      }

      return {
        pass: false,
        hint: 'Wallet is locked. Unlock it first (type password + press unlock-submit).',
      };
    },
  },

  'extension.loaded': {
    description: 'Extension is loaded and responsive',
    check: async (callHandler: CallHandlerFn) => {
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
    check: async (
      callHandler: CallHandlerFn,
      params?: Record<string, unknown>,
    ) => {
      const testId = params?.testId as string | undefined;
      if (!testId) {
        return {
          pass: false,
          hint: 'ext.element_visible requires a testId parameter.',
        };
      }
      const result = await callHandler('mm_wait_for', {
        testId,
        timeoutMs: 5000,
      });
      if (!result.ok) {
        return {
          pass: false,
          hint: `Element [data-testid="${testId}"] not found on screen.`,
        };
      }
      const { found } = result.result as Record<string, unknown>;
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
    check: async (
      callHandler: CallHandlerFn,
      params?: Record<string, unknown>,
    ) => {
      const hash = params?.hash as string | undefined;
      if (!hash) {
        return {
          pass: false,
          hint: 'ext.on_screen requires a hash parameter.',
        };
      }
      const result = await callHandler('mm_get_state', {});
      if (!result.ok) {
        return { pass: false, hint: 'Cannot get state to check screen.' };
      }
      const state = (result.result as Record<string, unknown>).state as
        | Record<string, unknown>
        | undefined;
      const currentUrl = state?.currentUrl as string | undefined;
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
