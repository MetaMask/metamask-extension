import os from 'node:os';
import type { ToolHooks, ToolHookContext } from '@metamask/client-mcp-core';
import { startObservation, propagateAttributes } from '@langfuse/tracing';
import { langfuseProcessor, otelSdk } from './instrumentation';

function resolveUserId(): string {
  return process.env.LANGFUSE_USER_ID ?? os.userInfo().username;
}

type SpanHandle = {
  update: (attrs: Record<string, unknown>) => SpanHandle;
  end: () => void;
  startObservation: (
    name: string,
    attrs?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ) => SpanHandle;
};

function redactSensitiveInput(
  input: unknown,
): Record<string, unknown> | unknown {
  if (typeof input !== 'object' || input === null) return input;
  const obj = { ...(input as Record<string, unknown>) };
  for (const key of Object.keys(obj)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('password') ||
      lower.includes('secret') ||
      lower.includes('srp') ||
      lower.includes('seed') ||
      lower.includes('mnemonic') ||
      lower.includes('privatekey')
    ) {
      obj[key] = '[REDACTED]';
    }
  }
  if (typeof obj.text === 'string' && obj.text.length > 500) {
    obj.text = `${obj.text.slice(0, 100)}... [truncated ${obj.text.length} chars]`;
  }
  return obj;
}

function redactLargeOutput(result: unknown): unknown {
  if (typeof result !== 'object' || result === null) return result;
  const obj = { ...(result as Record<string, unknown>) };
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > 1024) {
      const lower = key.toLowerCase();
      if (
        lower.includes('base64') ||
        lower.includes('screenshot') ||
        value.startsWith('data:image/') ||
        value.startsWith('iVBOR')
      ) {
        obj[key] = `[REDACTED base64 ${Math.round(value.length / 1024)}KB]`;
      }
    } else if (typeof value === 'object' && value !== null) {
      obj[key] = redactLargeOutput(value);
    }
  }
  return obj;
}

function setSpanUserId(span: SpanHandle, uid: string): void {
  (span as unknown as { otelSpan: { setAttribute(k: string, v: string): void } })
    .otelSpan?.setAttribute('user.id', uid);
}

function createToolSpan(
  toolName: string,
  input: unknown,
  parent: SpanHandle | undefined,
  uid: string,
): SpanHandle {
  const span = parent
    ? parent.startObservation(
        `tool:${toolName}`,
        { input: redactSensitiveInput(input) },
        { asType: 'tool' },
      )
    : (startObservation(
        `tool:${toolName}`,
        { input: redactSensitiveInput(input) },
        { asType: 'tool' },
      ) as unknown as SpanHandle);
  setSpanUserId(span, uid);
  return span;
}

export function createLangfuseHooks(): ToolHooks | undefined {
  if (!langfuseProcessor) return undefined;

  const sessionSpans = new Map<string, SpanHandle>();
  let activeSessionId: string | undefined;
  const userId = resolveUserId();

  return {
    onSessionStart(sessionId: string, metadata: Record<string, unknown>) {
      try {
        activeSessionId = sessionId;
        propagateAttributes(
          { sessionId, userId, traceName: `session:${sessionId}` },
          () => {
            const span = startObservation(
              `session:${sessionId}`,
              {
                input: metadata,
                metadata: { sessionId, ...metadata },
              },
              { asType: 'agent' },
            ) as unknown as SpanHandle;
            setSpanUserId(span, userId);
            sessionSpans.set(sessionId, span);
          },
        );
      } catch {
        // fire-and-forget
      }
    },

    onToolEnd(
      ctx: ToolHookContext & {
        result: unknown;
        durationMs: number;
        ok: boolean;
      },
    ) {
      try {
        const parent = ctx.sessionId
          ? sessionSpans.get(ctx.sessionId)
          : undefined;
        const sid = ctx.sessionId ?? activeSessionId;

        const doTrace = () => {
          const toolSpan = createToolSpan(ctx.toolName, ctx.input, parent, userId);
          toolSpan.update({
            output: redactLargeOutput(ctx.result),
            level: ctx.ok ? 'DEFAULT' : 'ERROR',
            metadata: { durationMs: ctx.durationMs, category: ctx.category },
          });
          toolSpan.end();
        };

        if (sid) {
          propagateAttributes({ sessionId: sid, userId }, doTrace);
        } else {
          doTrace();
        }

      } catch {
        // fire-and-forget
      }
    },

    onToolError(
      ctx: ToolHookContext & { error: string; durationMs: number },
    ) {
      try {
        const parent = ctx.sessionId
          ? sessionSpans.get(ctx.sessionId)
          : undefined;
        const sid = ctx.sessionId ?? activeSessionId;

        const doTrace = () => {
          const toolSpan = createToolSpan(ctx.toolName, ctx.input, parent, userId);
          toolSpan.update({
            level: 'ERROR',
            statusMessage: ctx.error,
            metadata: { durationMs: ctx.durationMs, category: ctx.category },
          });
          toolSpan.end();
        };

        if (sid) {
          propagateAttributes({ sessionId: sid, userId }, doTrace);
        } else {
          doTrace();
        }
      } catch {
        // fire-and-forget
      }
    },

    onSessionEnd(sessionId: string) {
      const span = sessionSpans.get(sessionId);
      if (span) {
        span.update({ output: { status: 'completed' } });
        span.end();
        sessionSpans.delete(sessionId);
        if (activeSessionId === sessionId) activeSessionId = undefined;
      }
    },

    async onServerStop() {
      for (const [, span] of sessionSpans) {
        span.update({ output: { status: 'daemon_shutdown' } });
        span.end();
      }
      sessionSpans.clear();
      activeSessionId = undefined;
      if (langfuseProcessor) {
        await langfuseProcessor.forceFlush();
      }
      if (otelSdk) {
        await otelSdk.shutdown();
      }
    },
  };
}
