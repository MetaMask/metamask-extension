import type {
  McpResponse,
  HandlerOptions,
  RunStepsInput,
  RunStepsResult,
  StepResult,
} from '../types';
import { toolSchemas, safeValidateToolInput, type ToolName } from '../schemas';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { toolHandlers } from './registry';

export async function handleRunSteps(
  input: RunStepsInput,
  options?: HandlerOptions,
): Promise<McpResponse<RunStepsResult>> {
  const batchStartTime = Date.now();
  const sessionId = sessionManager.getSessionId();

  if (!sessionManager.hasActiveSession()) {
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      'No active session. Call mm_launch first.',
      undefined,
      undefined,
      batchStartTime,
    );
  }

  const { steps: stepInputs, stopOnError = false } = input;
  const stepResults: StepResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const stepInput of stepInputs) {
    const stepStartTime = Date.now();
    const { tool, args = {} } = stepInput;

    const handler = toolHandlers[tool];
    if (!handler) {
      const result: StepResult = {
        tool,
        ok: false,
        error: {
          code: ErrorCodes.MM_UNKNOWN_TOOL,
          message: `Unknown tool: ${tool}`,
        },
        meta: {
          durationMs: Date.now() - stepStartTime,
          timestamp: new Date().toISOString(),
        },
      };
      stepResults.push(result);
      failed += 1;

      if (stopOnError) {
        break;
      }
      continue;
    }

    const schema = toolSchemas[tool as ToolName];
    if (schema) {
      const validation = safeValidateToolInput(tool as ToolName, args);
      if (!validation.success) {
        const result: StepResult = {
          tool,
          ok: false,
          error: {
            code: ErrorCodes.MM_INVALID_INPUT,
            message: `Invalid input: ${validation.error.message}`,
          },
          meta: {
            durationMs: Date.now() - stepStartTime,
            timestamp: new Date().toISOString(),
          },
        };
        stepResults.push(result);
        failed += 1;

        if (stopOnError) {
          break;
        }
        continue;
      }
    }

    try {
      const response = await handler(args, options);

      const result: StepResult = {
        tool,
        ok: response.ok,
        result: response.ok ? response.result : undefined,
        error: response.ok ? undefined : response.error,
        meta: {
          durationMs: Date.now() - stepStartTime,
          timestamp: new Date().toISOString(),
        },
      };

      stepResults.push(result);

      if (response.ok) {
        succeeded += 1;
      } else {
        failed += 1;
        if (stopOnError) {
          break;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const result: StepResult = {
        tool,
        ok: false,
        error: {
          code: ErrorCodes.MM_INTERNAL_ERROR,
          message: `Unexpected error: ${message}`,
        },
        meta: {
          durationMs: Date.now() - stepStartTime,
          timestamp: new Date().toISOString(),
        },
      };
      stepResults.push(result);
      failed += 1;

      if (stopOnError) {
        break;
      }
    }
  }

  const batchResult: RunStepsResult = {
    steps: stepResults,
    summary: {
      ok: failed === 0,
      total: stepResults.length,
      succeeded,
      failed,
      durationMs: Date.now() - batchStartTime,
    },
  };

  return createSuccessResponse(batchResult, sessionId, batchStartTime);
}
