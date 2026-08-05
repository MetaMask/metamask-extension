import { useEffect, useRef, type RefObject } from 'react';

type EventTargetOrRef = EventTarget | RefObject<EventTarget | null>;

function resolveTarget(
  target: EventTargetOrRef | undefined,
): EventTarget | null {
  if (target === undefined) {
    return window;
  }

  if (!('addEventListener' in target)) {
    return target.current;
  }

  return target;
}

export function useEventListener<EventType extends Event = Event>(
  eventName: string,
  handler: (event: EventType) => void,
  element?: EventTargetOrRef,
): void {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    const target = resolveTarget(element);

    if (!target?.addEventListener) {
      return undefined;
    }

    const listener = (event: Event) => {
      savedHandler.current(event as EventType);
    };

    target.addEventListener(eventName, listener);
    return () => {
      target.removeEventListener(eventName, listener);
    };
  }, [eventName, element]);
}
