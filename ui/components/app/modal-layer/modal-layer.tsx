import React, {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';

export enum ModalPriority {
  Normal,
  Urgent,
}

type Request = { id: string; parentId?: string; priority: ModalPriority };

function createModalStore() {
  const requests = new Map<string, Request>();
  const listeners = new Set<() => void>();
  const eventOwners = new WeakMap<Event, string | undefined>();
  let activeId: string | undefined;

  const notify = () => {
    const parents = new Set(
      [...requests.values()].map(({ parentId }) => parentId),
    );
    activeId = [...requests.values()]
      .filter(({ id }) => !parents.has(id))
      .reduce<Request | undefined>(
        (active, request) =>
          !active || request.priority >= active.priority ? request : active,
        undefined,
      )?.id;
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getActiveId: () => activeId,
    has: (id: string) => requests.has(id),
    register: (request: Request) => {
      requests.set(request.id, request);
      notify();
      return () => {
        requests.delete(request.id);
        notify();
      };
    },
    ownsEvent: (id: string, event: Event) => {
      // A synchronous close must not pass the same event to the resumed modal.
      if (!eventOwners.has(event)) {
        eventOwners.set(event, activeId);
      }
      return eventOwners.get(event) === id;
    },
  };
}

const ModalStoreContext = createContext<ReturnType<
  typeof createModalStore
> | null>(null);

/** Coordinates dialogs across routes, portals, and the legacy Redux modal host. */
export function ModalProvider({ children }: React.PropsWithChildren) {
  const [store] = useState(createModalStore);
  return (
    <ModalStoreContext.Provider value={store}>
      {children}
    </ModalStoreContext.Provider>
  );
}

export const ModalLayerContext = createContext<{
  id: string;
  priority: ModalPriority;
  isActive: boolean;
  isRegistered: () => boolean;
  ownsEvent: (event: Event) => boolean;
} | null>(null);

const subscribeUnmanaged = () => () => undefined;
const getUnmanagedSnapshot = () => undefined;

/** Floating UI is interactive only when it belongs to the active modal (or no modal is open). */
export function useModalActivity() {
  const store = useContext(ModalStoreContext);
  const layer = useContext(ModalLayerContext);
  const activeId = useSyncExternalStore(
    store?.subscribe ?? subscribeUnmanaged,
    store?.getActiveId ?? getUnmanagedSnapshot,
  );
  return !store || activeId === layer?.id;
}

/** Register an open modal; descendants inherit priority and take precedence over parents. */
export function useModalLayer(isOpen: boolean, priority?: ModalPriority) {
  const store = useContext(ModalStoreContext);
  const parent = useContext(ModalLayerContext);
  const id = useId();
  const parentId = parent?.id;
  const effectivePriority = Math.max(
    priority ?? ModalPriority.Normal,
    parent?.priority ?? ModalPriority.Normal,
  );
  const activeId = useSyncExternalStore(
    store?.subscribe ?? subscribeUnmanaged,
    store?.getActiveId ?? getUnmanagedSnapshot,
  );

  useLayoutEffect(() => {
    if (isOpen) {
      return store?.register({ id, parentId, priority: effectivePriority });
    }
    return undefined;
  }, [store, isOpen, id, parentId, effectivePriority]);

  return {
    id,
    priority: effectivePriority,
    isActive: isOpen && (!store || activeId === id),
    isRegistered: () => store?.has(id) ?? false,
    ownsEvent: (event: Event) => store?.ownsEvent(id, event) ?? true,
  };
}
