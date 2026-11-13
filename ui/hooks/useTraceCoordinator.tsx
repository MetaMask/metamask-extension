import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { TraceName } from '#shared/lib/trace';
import { useLayoutTrace, useTrace } from '#ui/hooks/useTrace';

type ContextValue = {
  parentId?: string;
  parentName: TraceName;
  reportReady: (signal: string) => void;
};

type Props = {
  children: ReactNode;
  name: TraceName;
  op: string;
  parentId?: string;
  requiredSignals: readonly string[];
};

type Options = Omit<
  Parameters<typeof useTrace>[0],
  'data' | 'enabled' | 'onEnd' | 'parentId' | 'parentName'
> & {
  data: NonNullable<Parameters<typeof useTrace>[0]['data']>;
  sectionId: string;
};

const TraceCoordinatorContext = createContext<ContextValue | undefined>(
  undefined,
);

export const TraceCoordinator = ({
  children,
  name,
  op,
  parentId,
  requiredSignals,
}: Props) => {
  const enabled = Boolean(parentId);
  const [completedSignals, setCompletedSignals] = useState({
    parentId,
    signals: new Set<string>(),
  });
  const completedSignalsForParent =
    completedSignals.parentId === parentId
      ? completedSignals.signals
      : new Set<string>();
  const ready = requiredSignals.every((signal) =>
    completedSignalsForParent.has(signal),
  );

  const reportReady = useCallback(
    (signal: string) => {
      setCompletedSignals((current) => {
        if (current.parentId !== parentId) {
          return { parentId, signals: new Set([signal]) };
        }
        if (current.signals.has(signal)) {
          return current;
        }
        return { parentId, signals: new Set([...current.signals, signal]) };
      });
    },
    [parentId],
  );
  const value = useMemo(
    () => ({ parentId, parentName: name, reportReady }),
    [name, parentId, reportReady],
  );

  useLayoutTrace({
    name,
    op,
    enabled,
    id: parentId,
    ready,
    data: { success: true },
  });

  return (
    <TraceCoordinatorContext.Provider value={value}>
      {children}
    </TraceCoordinatorContext.Provider>
  );
};

export const useTraceCoordinator = () => useContext(TraceCoordinatorContext);

export const useCoordinatedTrace = ({
  data,
  sectionId,
  ...options
}: Options) => {
  const coordinator = useTraceCoordinator();
  const reportReady = useCallback(
    () => coordinator?.reportReady(sectionId),
    [coordinator, sectionId],
  );

  useTrace({
    ...options,
    enabled: Boolean(coordinator?.parentId),
    parentName: coordinator?.parentName,
    parentId: coordinator?.parentId,
    onEnd: reportReady,
    data: { ...data, sectionId },
  });
};
