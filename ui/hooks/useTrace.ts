import { useEffect, useId, useRef } from 'react';
import { endTrace, trace, TraceName } from '#shared/lib/trace';
import { toSnakeCase } from '#shared/lib/string-utils';

const normalizeTraceData = (data?: Record<string, number | string | boolean>) =>
  data &&
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [toSnakeCase(key), value]),
  );

export function useTrace({
  name,
  op,
  enabled = true,
  generationKey = 'default',
  id,
  parentName,
  parentId,
  ready,
  deferEnd,
  onEnd,
  data,
}: {
  name: TraceName;
  op?: string;
  enabled?: boolean;
  generationKey?: string | number;
  id?: string;
  parentName?: TraceName;
  parentId?: string;
  ready?: boolean;
  deferEnd?: boolean;
  onEnd?: () => void;
  data?: Record<string, number | string | boolean>;
}) {
  const hookId = useId();
  const activeTrace = useRef({ id: '', ended: true });
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;

    return () => {
      isUnmounted.current = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const traceId = id ?? `${hookId}:${generationKey}`;
    const traceState = { id: traceId, ended: false };
    activeTrace.current = traceState;
    const parentContext =
      parentName && parentId
        ? {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _name: parentName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _id: parentId,
          }
        : undefined;

    trace({ name, id: traceId, op, parentContext });

    return () => {
      if (!traceState.ended) {
        endTrace({
          name,
          id: traceId,
          data: {
            success: false,
            reason: isUnmounted.current ? 'unmounted' : 'superseded',
          },
        });
        traceState.ended = true;
      }
    };
  }, [enabled, generationKey, hookId, id, name, op, parentName, parentId]);

  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    if (
      activeTrace.current.ended ||
      activeTrace.current.id !== (id ?? `${hookId}:${generationKey}`)
    ) {
      return;
    }

    const endCurrentTrace = () => {
      if (
        activeTrace.current.ended ||
        activeTrace.current.id !== (id ?? `${hookId}:${generationKey}`)
      ) {
        return;
      }

      endTrace({
        name,
        id: activeTrace.current.id,
        data: normalizeTraceData(data),
      });
      activeTrace.current.ended = true;
      onEnd?.();
    };

    if (deferEnd) {
      queueMicrotask(endCurrentTrace);
      return;
    }

    endCurrentTrace();
  }, [
    data,
    deferEnd,
    enabled,
    generationKey,
    hookId,
    id,
    name,
    op,
    onEnd,
    parentId,
    parentName,
    ready,
  ]);
}
