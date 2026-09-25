import { useEffect, useId, useRef } from 'react';
import { endTrace, trace, TraceName } from '#shared/lib/trace';

export function useTrace({
  name,
  op,
  enabled = true,
  generationKey = 'default',
  ready = false,
  data,
}: {
  name: TraceName;
  op?: string;
  enabled?: boolean;
  generationKey?: string | number;
  ready?: boolean;
  data?: Record<string, number | string | boolean>;
}) {
  const id = useId();
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

    const traceId = `${id}:${generationKey}`;
    const traceState = { id: traceId, ended: false };
    activeTrace.current = traceState;

    trace({ name, id: traceId, op });

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
  }, [enabled, generationKey, id, name, op]);

  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    if (
      activeTrace.current.ended ||
      activeTrace.current.id !== `${id}:${generationKey}`
    ) {
      return;
    }

    endTrace({ name, id: activeTrace.current.id, data });
    activeTrace.current.ended = true;
  }, [data, enabled, generationKey, id, name, ready]);
}
