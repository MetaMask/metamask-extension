import { useEffect, useRef } from 'react';

const on = function (obj, ...args) {
  if (obj && obj.addEventListener) {
    obj.addEventListener(...args);
  }
};

const off = function (obj, ...args) {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(...args);
  }
};

const defaultEvents = ['mousedown', 'touchstart'];

export const useClickAway = (ref, onClickAway, events = defaultEvents) => {
  const savedCallback = useRef(onClickAway);
  useEffect(() => {
    savedCallback.current = onClickAway;
  }, [onClickAway]);
  useEffect(() => {
    const handler = (event) => {
      const el = ref.current;
      el && !el.contains(event.target) && savedCallback.current(event);
    };
    for (const eventName of events) {
      on(document, eventName, handler);
    }
    return () => {
      for (const eventName of events) {
        off(document, eventName, handler);
      }
    };
  }, [events, ref]);
};
