import type {
  ClickInput,
  ClickResult,
  TypeInput,
  TypeResult,
  WaitForInput,
  WaitForResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createErrorResponse,
  ErrorCodes,
  validateTargetSelection,
} from '../types';
import { sessionManager } from '../session-manager';
import { waitForTarget } from '../discovery';
import { runTool } from './run-tool';
import {
  classifyClickError,
  classifyTypeError,
  classifyWaitError,
} from './error-classification';

export async function handleClick(
  input: ClickInput,
  options?: HandlerOptions,
): Promise<McpResponse<ClickResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const timeoutMs = input.timeoutMs ?? 15000;

  const validation = validateTargetSelection(input);
  if (!validation.valid) {
    return createErrorResponse(
      ErrorCodes.MM_INVALID_INPUT,
      (validation as { valid: false; error: string }).error,
      { input },
      sessionId,
      startTime,
    );
  }

  const { type: targetType, value: targetValue } = validation as {
    valid: true;
    type: 'a11yRef' | 'testId' | 'selector';
    value: string;
  };

  return runTool<ClickInput, ClickResult>({
    toolName: 'mm_click',
    input,
    options,

    execute: async (context) => {
      const locator = await waitForTarget(
        context.page,
        targetType,
        targetValue,
        context.refMap,
        timeoutMs,
      );
      await locator.click();

      return {
        clicked: true,
        target: `${targetType}:${targetValue}`,
      };
    },

    getTarget: () => ({ [targetType]: targetValue }),

    classifyError: classifyClickError,

    sanitizeInputForRecording: () => ({ timeoutMs }),
  });
}

export async function handleType(
  input: TypeInput,
  options?: HandlerOptions,
): Promise<McpResponse<TypeResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const timeoutMs = input.timeoutMs ?? 15000;

  const validation = validateTargetSelection(input);
  if (!validation.valid) {
    return createErrorResponse(
      ErrorCodes.MM_INVALID_INPUT,
      (validation as { valid: false; error: string }).error,
      { input: { ...input, text: '[REDACTED]' } },
      sessionId,
      startTime,
    );
  }

  const { type: targetType, value: targetValue } = validation as {
    valid: true;
    type: 'a11yRef' | 'testId' | 'selector';
    value: string;
  };

  return runTool<TypeInput, TypeResult>({
    toolName: 'mm_type',
    input,
    options,

    execute: async (context) => {
      const locator = await waitForTarget(
        context.page,
        targetType,
        targetValue,
        context.refMap,
        timeoutMs,
      );
      await locator.fill(input.text);

      return {
        typed: true,
        target: `${targetType}:${targetValue}`,
        textLength: input.text.length,
      };
    },

    getTarget: () => ({ [targetType]: targetValue }),

    classifyError: classifyTypeError,

    sanitizeInputForRecording: () => ({
      timeoutMs,
      text: input.text,
      testId: input.testId,
      selector: input.selector,
      a11yRef: input.a11yRef,
    }),
  });
}

export async function handleWaitFor(
  input: WaitForInput,
  options?: HandlerOptions,
): Promise<McpResponse<WaitForResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const timeoutMs = input.timeoutMs ?? 15000;

  const validation = validateTargetSelection(input);
  if (!validation.valid) {
    return createErrorResponse(
      ErrorCodes.MM_INVALID_INPUT,
      (validation as { valid: false; error: string }).error,
      { input },
      sessionId,
      startTime,
    );
  }

  const { type: targetType, value: targetValue } = validation as {
    valid: true;
    type: 'a11yRef' | 'testId' | 'selector';
    value: string;
  };

  return runTool<WaitForInput, WaitForResult>({
    toolName: 'mm_wait_for',
    input,
    options,

    execute: async (context) => {
      await waitForTarget(
        context.page,
        targetType,
        targetValue,
        context.refMap,
        timeoutMs,
      );

      return {
        found: true,
        target: `${targetType}:${targetValue}`,
      };
    },

    getTarget: () => ({ [targetType]: targetValue }),

    classifyError: classifyWaitError,

    sanitizeInputForRecording: () => ({ timeoutMs }),
  });
}
