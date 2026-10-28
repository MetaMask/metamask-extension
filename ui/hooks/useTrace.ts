import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { endTrace, trace, TraceName } from '#shared/lib/trace';
import { toSnakeCase } from '#shared/lib/string-utils';

type Options = {
  name: TraceName;
  op?: string;
  enabled?: boolean;
  generationKey?: string | number;
  id?: string;
  parentName?: TraceName;
  parentId?: string;
  ready?: boolean;
  onEnd?: () => void;
  data?: Record<string, number | string | boolean>;
};

const normalizeTraceData = (data?: Record<string, number | string | boolean>) =>
  data &&
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [toSnakeCase(key), value]),
  );

const useTraceLifecycle = ({
  name,
  op,
  enabled = true,
  generationKey = 'default',
  id,
  parentName,
  parentId,
  ready,
  onEnd,
  data,
}: Options) => {
  const hookId = useId();
  const isUnmounted = useRef(false);

  useLayoutEffect(() => {
    isUnmounted.current = false;

    return () => {
      isUnmounted.current = true;
    };
  }, []);

  const traceId = id ?? `${hookId}:${generationKey}`;
  const parentContext = useMemo(
    () =>
      parentName && parentId
        ? {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _name: parentName,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _id: parentId,
          }
        : undefined,
    [parentId, parentName],
  );
  const traceGeneration = useMemo(
    () => ({ name, op, parentContext, traceId }),
    [name, op, parentContext, traceId],
  );
  const activeTrace = useRef({
    id: '',
    generation: traceGeneration,
    ended: true,
  });

  const startTrace = useCallback(() => {
    if (!enabled) {
      return undefined;
    }

    const traceState = {
      id: traceId,
      generation: traceGeneration,
      ended: false,
    };
    activeTrace.current = traceState;

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
  }, [enabled, name, op, parentContext, traceGeneration, traceId]);

  const endWhenReady = useCallback(() => {
    if (!enabled || !ready) {
      return;
    }

    if (
      activeTrace.current.ended ||
      activeTrace.current.generation !== traceGeneration
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
  }, [data, enabled, name, onEnd, ready, traceGeneration]);

  return { endWhenReady, startTrace };
};

export function useTrace(options: Options) {
  const { endWhenReady, startTrace } = useTraceLifecycle(options);

  useEffect(() => startTrace(), [startTrace]);
  useEffect(() => endWhenReady(), [endWhenReady]);
}

export function useLayoutTrace(options: Options) {
  const { endWhenReady, startTrace } = useTraceLifecycle(options);

  useLayoutEffect(() => startTrace(), [startTrace]);
  useEffect(() => endWhenReady(), [endWhenReady]);
}
