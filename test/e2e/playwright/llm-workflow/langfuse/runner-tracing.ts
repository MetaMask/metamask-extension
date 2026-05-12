import os from 'node:os';
import { langfuseProcessor } from './instrumentation';
import { startObservation, propagateAttributes } from '@langfuse/tracing';

export type SpanHandle = {
  update: (attrs: Record<string, unknown>) => SpanHandle;
  end: () => void;
  startObservation: (
    name: string,
    attrs?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ) => SpanHandle;
};

export function resolveUserId(): string {
  return process.env.LANGFUSE_USER_ID ?? os.userInfo().username;
}

export function isTracingEnabled(): boolean {
  return langfuseProcessor !== undefined;
}

export function traceSpan(
  sessionId: string | undefined,
  userId: string,
  fn: () => void,
): void {
  if (!langfuseProcessor || !sessionId) return;
  try {
    propagateAttributes({ sessionId, userId }, fn);
  } catch {
    /* fire-and-forget */
  }
}

export function createSessionSpan(
  prompt: string,
  metadata: Record<string, unknown>,
  redact: boolean,
): { span: SpanHandle; traceId: string } | undefined {
  if (!langfuseProcessor) return undefined;

  const obs = startObservation(
    `claude-runner`,
    {
      input: redact ? '[REDACTED]' : prompt,
      metadata,
    },
    { asType: 'agent' },
  );
  return {
    span: obs as unknown as SpanHandle,
    traceId: (obs as unknown as { traceId: string }).traceId,
  };
}

export function setOtelAttrs(
  span: SpanHandle,
  attrs: Record<string, string | number>,
): void {
  const otel = (
    span as unknown as {
      otelSpan?: { setAttribute(k: string, v: string | number): void };
    }
  ).otelSpan;
  if (!otel) return;
  for (const [k, v] of Object.entries(attrs)) {
    otel.setAttribute(k, v);
  }
}

export async function flushTracing(): Promise<void> {
  if (langfuseProcessor) {
    await langfuseProcessor.forceFlush();
  }
}
